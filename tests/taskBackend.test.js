const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createTaskSchema,
  updateTaskSchema,
  createTaskCommentSchema,
  taskQuerySchema,
} = require('../validators/task.validators');

const {
  canAccessProject,
  canManageProject,
  canCommentOnTask,
  taskStatusOptions,
} = require('../utils/projectPermissions');

const taskController = require('../controller/taskController');
const database = require('../database');

test('task validation accepts valid payloads', () => {
  const task = createTaskSchema.parse({
    title: 'Write API docs',
    description: 'Add task docs',
    status: 'todo',
    priority: 'high',
    assigneeId: '123e4567-e89b-12d3-a456-426614174000',
    projectId: '123e4567-e89b-12d3-a456-426614174001',
  });

  assert.equal(task.status, 'todo');
  assert.equal(task.priority, 'high');
});

test('task query validation supports pagination and filters', () => {
  const query = taskQuerySchema.parse({
    page: '2',
    limit: '10',
    status: 'in_progress',
    assigneeId: '123e4567-e89b-12d3-a456-426614174000',
    search: 'schema',
  });

  assert.equal(query.page, 2);
  assert.equal(query.status, 'in_progress');
  assert.equal(query.limit, 10);
  assert.equal(query.search, 'schema');
});

test('permission helpers resolve project access correctly', () => {
  assert.equal(canAccessProject('admin', true), true);
  assert.equal(canAccessProject('member', true), true);
  assert.equal(canAccessProject('viewer', true), true);
  assert.equal(canAccessProject('viewer', false), false);
  assert.equal(canManageProject('admin'), true);
  assert.equal(canManageProject('viewer'), false);
  assert.equal(canCommentOnTask('member'), true);
  assert.equal(canCommentOnTask('viewer'), false);
  assert.deepEqual(taskStatusOptions.includes('todo'), true);
});

test('comment validation enforces a body', () => {
  assert.throws(() => createTaskCommentSchema.parse({ body: '' }));
  assert.throws(() => createTaskCommentSchema.parse({}));
});

test('task routes return a project error without crashing when access is denied', async () => {
  const originalFindByPk = database.Project.findByPk;
  database.Project.findByPk = async () => null;

  const req = {
    params: { projectId: '123e4567-e89b-12d3-a456-426614174000' },
    query: {},
    headers: { 'x-user-id': '123e4567-e89b-12d3-a456-426614174111', 'x-user-role': 'member' },
  };

  let capturedError;
  const res = {
    statusCode: 200,
    json: () => {},
  };
  const next = (err) => {
    capturedError = err;
  };

  try {
    await taskController.getTasks(req, res, next);
    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 404);
  } finally {
    database.Project.findByPk = originalFindByPk;
  }
});
