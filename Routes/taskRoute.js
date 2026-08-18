const express = require('express');
const taskController = require('../controller/taskController');

const router = express.Router();

router.route('/projects')
  .post(taskController.createProject);

router.route('/projects/:projectId')
  .get(taskController.getProjectById);

router.route('/projects/:projectId/tasks')
  .get(taskController.getTasks)
  .post(taskController.createTask);

router.route('/projects/:projectId/tasks/:taskId')
  .get(taskController.getTaskById)
  .patch(taskController.updateTask);

router.route('/projects/:projectId/tasks/:taskId/comments')
  .get(taskController.getTaskComments)
  .post(taskController.addTaskComment);

router.route('/projects/:projectId/tasks/:taskId/activity')
  .get(taskController.getTaskActivity);

router.route('/projects/:projectId/activity')
  .get(taskController.getProjectActivity);

module.exports = router;
