const crypto = require('crypto');
const { Task, TaskComment, TaskActivity, Project, Op } = require('./../database');
const response = require('./../Middleware/response');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const validate = require('./../utils/validateApiEvent');
const { createTaskSchema, updateTaskSchema, createTaskCommentSchema, taskQuerySchema } = require('./../validators/task.validators');
const { canAccessProject, canManageProject, canCommentOnTask, getProjectRole, getRequester } = require('./../utils/projectPermissions');

const normalizeTaskStatus = (status) => status === 'in_progress' ? 'in_progress' : status;

const ensureProjectAccess = async (req, projectId, next) => {
  const { id: userId, role } = getRequester(req);

  if (!userId) {
    next(new AppError('Authentication required', 401));
    return null;
  }

  const project = await Project.findByPk(projectId);
  if (!project) {
    next(new AppError('Project not found', 404));
    return null;
  }

  const permission = canAccessProject(role, Boolean(project && project.ownerId === userId) || (Array.isArray(project.members) && project.members.some((member) => member && (member.userId === userId || member.id === userId))));
  if (!permission) {
    next(new AppError('You do not have access to this project', 403));
    return null;
  }

  return { project, userId, role };
};

const getTaskProjectAccess = async (req, projectId, next) => {
  const { id: userId, role } = getRequester(req);
  const project = await Project.findByPk(projectId);

  if (!project) {
    next(new AppError('Project not found', 404));
    return null;
  }

  const isMember = project.ownerId === userId || (Array.isArray(project.members) && project.members.some((member) => member && (member.userId === userId || member.id === userId)));
  if (!isMember) {
    next(new AppError('Non-project users cannot access this project', 403));
    return null;
  }

  return { project, userId, role: role || getProjectRole(project, userId) };
};

const recordTaskActivity = async ({ projectId, taskId, actorId, actorName, action, details = {}, transaction = null }) => {
  await TaskActivity.create({
    projectId,
    taskId,
    actorId,
    actorName,
    action,
    details,
  }, { transaction });
};

exports.createProject = catchAsync(async (req, res, next) => {
  const payload = req.body || {};
  const ownerId = payload.ownerId || req.headers['x-user-id'];

  if (!ownerId) {
    return next(new AppError('ownerId is required. Send it in the body or x-user-id header.', 400));
  }

  const projectId = payload.id || crypto.randomUUID();
  const members = Array.isArray(payload.members) && payload.members.length
    ? payload.members
    : [{ userId: ownerId, role: 'admin' }];

  const [project, created] = await Project.findOrCreate({
    where: { id: projectId },
    defaults: {
      id: projectId,
      name: payload.name || 'Demo Project',
      description: payload.description || 'Created for task testing',
      ownerId,
      members,
      status: payload.status || 'active',
    },
  });

  return response(res, created ? 201 : 200, true, created ? 'Project created successfully' : 'Project already exists', project);
});

exports.getProjectById = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  const project = await Project.findByPk(projectId);

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  return response(res, 200, true, 'Project fetched successfully', project);
});

exports.createTask = catchAsync(async (req, res, next) => {
  const payload = validate(createTaskSchema, req.body, next);
  if (!payload) return;

  const { projectId } = payload;
  const access = await ensureProjectAccess(req, projectId, next);
  if (!access) return;

  const { project, userId, role } = access;
  if (!project || !userId) return;

  if (!canManageProject(role) && project.ownerId !== userId) {
    return next(new AppError('Only project admins can create tasks', 403));
  }

  const transaction = await Task.sequelize.transaction();

  try {
    const task = await Task.create({
      ...payload,
      createdById: userId,
      status: normalizeTaskStatus(payload.status || 'todo'),
    }, { transaction });

    await recordTaskActivity({
      projectId,
      taskId: task.id,
      actorId: userId,
      actorName: req.user?.name || 'System User',
      action: 'task_created',
      details: { title: task.title },
      transaction,
    });

    await transaction.commit();
    return response(res, 201, true, 'Task created successfully', task);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

exports.getTasks = catchAsync(async (req, res, next) => {
  const query = validate(taskQuerySchema, req.query, next);
  if (!query) return;

  const { projectId } = req.params;
  const access = await getTaskProjectAccess(req, projectId, next);
  if (!access) return;

  const { project, userId } = access;
  if (!project || !userId) return;

  const where = { projectId };
  if (query.status) where.status = query.status;
  if (query.assigneeId) where.assigneeId = query.assigneeId;
  if (query.search) {
    where.title = { [Op.iLike]: `%${query.search}%` };
  }

  const { count, rows } = await Task.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: query.limit,
    offset: (query.page - 1) * query.limit,
  });

  return response(res, 200, true, 'Tasks fetched successfully', {
    tasks: rows,
    page: query.page,
    limit: query.limit,
    total: count,
    totalPages: Math.ceil(count / query.limit),
  });
});

exports.getTaskById = catchAsync(async (req, res, next) => {
  const { projectId, taskId } = req.params;
  const access = await getTaskProjectAccess(req, projectId, next);
  if (!access) return;

  const { project, userId } = access;
  if (!project || !userId) return;

  const task = await Task.findOne({
    where: { id: taskId, projectId },
    include: [{ model: TaskComment, as: 'comments', order: [['createdAt', 'DESC']] }],
  });

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  return response(res, 200, true, 'Task fetched successfully', task);
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const payload = validate(updateTaskSchema, req.body, next);
  if (!payload) return;

  const { projectId, taskId } = req.params;
  const access = await getTaskProjectAccess(req, projectId, next);
  if (!access) return;

  const { project, userId, role } = access;
  if (!project || !userId) return;

  const task = await Task.findOne({ where: { id: taskId, projectId } });
  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  if (!canManageProject(role) && task.createdById !== userId && task.assigneeId !== userId) {
    return next(new AppError('You cannot update this task', 403));
  }

  const previousStatus = task.status;
  const previousAssignee = task.assigneeId;

  const transaction = await Task.sequelize.transaction();

  try {
    const updatedTask = await task.update({
      ...payload,
      ...(payload.status ? { status: normalizeTaskStatus(payload.status) } : {}),
    }, { transaction });

    if (payload.status && payload.status !== previousStatus) {
      await recordTaskActivity({
        projectId,
        taskId,
        actorId: userId,
        actorName: req.user?.name || 'System User',
        action: 'status_changed',
        details: { from: previousStatus, to: payload.status },
        transaction,
      });
    }

    if (payload.assigneeId !== undefined && payload.assigneeId !== previousAssignee) {
      await recordTaskActivity({
        projectId,
        taskId,
        actorId: userId,
        actorName: req.user?.name || 'System User',
        action: 'assignee_changed',
        details: { from: previousAssignee, to: payload.assigneeId },
        transaction,
      });
    }

    await transaction.commit();
    return response(res, 200, true, 'Task updated successfully', updatedTask);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

exports.addTaskComment = catchAsync(async (req, res, next) => {
  const payload = validate(createTaskCommentSchema, req.body, next);
  if (!payload) return;

  const { projectId, taskId } = req.params;
  const access = await getTaskProjectAccess(req, projectId, next);
  if (!access) return;

  const { project, userId, role } = access;
  if (!project || !userId) return;

  if (!canCommentOnTask(role)) {
    return next(new AppError('Viewer users cannot add comments', 403));
  }

  const task = await Task.findOne({ where: { id: taskId, projectId } });
  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  const transaction = await TaskComment.sequelize.transaction();

  try {
    const comment = await TaskComment.create({
      projectId,
      taskId,
      authorId: userId,
      authorName: req.user?.name || 'System User',
      body: payload.body,
    }, { transaction });

    await recordTaskActivity({
      projectId,
      taskId,
      actorId: userId,
      actorName: req.user?.name || 'System User',
      action: 'comment_added',
      details: { commentId: comment.id },
      transaction,
    });

    await transaction.commit();
    return response(res, 201, true, 'Comment added successfully', comment);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

exports.getTaskComments = catchAsync(async (req, res, next) => {
  const { projectId, taskId } = req.params;
  const access = await getTaskProjectAccess(req, projectId, next);
  if (!access) return;

  const { project, userId } = access;
  if (!project || !userId) return;

  const task = await Task.findOne({ where: { id: taskId, projectId } });
  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  const comments = await TaskComment.findAll({
    where: { taskId, projectId },
    order: [['createdAt', 'DESC']],
  });

  return response(res, 200, true, 'Comments fetched successfully', comments);
});

exports.getTaskActivity = catchAsync(async (req, res, next) => {
  const { projectId, taskId } = req.params;
  const access = await getTaskProjectAccess(req, projectId, next);
  if (!access) return;

  const { project, userId } = access;
  if (!project || !userId) return;

  const task = await Task.findOne({ where: { id: taskId, projectId } });
  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  const activity = await TaskActivity.findAll({
    where: { taskId, projectId },
    order: [['createdAt', 'DESC']],
  });

  return response(res, 200, true, 'Task activity fetched successfully', activity);
});

exports.getProjectActivity = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  const access = await getTaskProjectAccess(req, projectId, next);
  if (!access) return;

  const { project, userId } = access;
  if (!project || !userId) return;

  const activity = await TaskActivity.findAll({
    where: { projectId },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });

  return response(res, 200, true, 'Project activity fetched successfully', activity);
});
