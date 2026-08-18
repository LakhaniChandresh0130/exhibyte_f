const taskStatusOptions = ['todo', 'in_progress', 'in_review', 'done'];
const taskPriorityOptions = ['low', 'medium', 'high', 'urgent'];

function normalizeRole(role) {
  const value = String(role || '').toLowerCase();
  if (['owner', 'admin'].includes(value)) return 'admin';
  if (value === 'member') return 'member';
  return 'viewer';
}

function getRequester(req) {
  const user = req.user || {};
  const role = normalizeRole(user.role || req.headers['x-user-role']);
  const userId = user.id || req.headers['x-user-id'];

  return {
    id: userId || null,
    role,
  };
}

function isProjectMember(project, userId) {
  if (!project || !userId) return false;
  if (project.ownerId === userId) return true;

  const members = Array.isArray(project.members) ? project.members : [];
  return members.some((member) => member && (member.userId === userId || member.id === userId));
}

function getProjectRole(project, userId) {
  if (!project || !userId) return 'viewer';
  if (project.ownerId === userId) return 'admin';

  const members = Array.isArray(project.members) ? project.members : [];
  const member = members.find((entry) => entry && (entry.userId === userId || entry.id === userId));
  if (!member) return 'viewer';

  return normalizeRole(member.role || 'member');
}

function canAccessProject(role, isProjectMember) {
  return Boolean(isProjectMember) && ['admin', 'member', 'viewer'].includes(normalizeRole(role));
}

function canManageProject(role) {
  return normalizeRole(role) === 'admin';
}

function canCommentOnTask(role) {
  return ['admin', 'member'].includes(normalizeRole(role));
}

module.exports = {
  normalizeRole,
  getRequester,
  isProjectMember,
  getProjectRole,
  canAccessProject,
  canManageProject,
  canCommentOnTask,
  taskStatusOptions,
  taskPriorityOptions,
};
