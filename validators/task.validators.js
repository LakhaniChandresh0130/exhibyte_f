const { z } = require('zod');

const taskStatusEnum = ['todo', 'in_progress', 'in_review', 'done'];
const taskPriorityEnum = ['low', 'medium', 'high', 'urgent'];

const createTaskSchema = z.object({
  projectId: z.string({ message: 'projectId is required' }).uuid({ message: 'projectId must be a valid UUID' }),
  title: z.string({ message: 'title is required' }).trim().min(1, { message: 'title cannot be empty' }).max(200, { message: 'title cannot exceed 200 characters' }),
  description: z.string().trim().max(5000, { message: 'description cannot exceed 5000 characters' }).optional().nullable(),
  status: z.enum(taskStatusEnum, { message: 'status must be one of todo, in_progress, in_review, done' }).optional(),
  priority: z.enum(taskPriorityEnum, { message: 'priority must be one of low, medium, high, urgent' }).optional(),
  assigneeId: z.string().uuid({ message: 'assigneeId must be a valid UUID' }).optional().nullable(),
  dueDate: z.string().datetime({ message: 'dueDate must be a valid ISO date' }).optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1, { message: 'title cannot be empty' }).max(200, { message: 'title cannot exceed 200 characters' }).optional(),
  description: z.string().trim().max(5000, { message: 'description cannot exceed 5000 characters' }).optional().nullable(),
  status: z.enum(taskStatusEnum, { message: 'status must be one of todo, in_progress, in_review, done' }).optional(),
  priority: z.enum(taskPriorityEnum, { message: 'priority must be one of low, medium, high, urgent' }).optional(),
  assigneeId: z.string().uuid({ message: 'assigneeId must be a valid UUID' }).optional().nullable(),
  dueDate: z.string().datetime({ message: 'dueDate must be a valid ISO date' }).optional().nullable(),
});

const createTaskCommentSchema = z.object({
  body: z.string({ message: 'body is required' }).trim().min(1, { message: 'comment body cannot be empty' }).max(2000, { message: 'comment body cannot exceed 2000 characters' }),
});

const taskQuerySchema = z.object({
  page: z.coerce.number({ invalid_type_error: 'page must be a number' }).int().min(1).default(1),
  limit: z.coerce.number({ invalid_type_error: 'limit must be a number' }).int().min(1).max(100).default(20),
  status: z.enum(taskStatusEnum, { message: 'status must be one of todo, in_progress, in_review, done' }).optional(),
  assigneeId: z.string().uuid({ message: 'assigneeId must be a valid UUID' }).optional(),
  search: z.string().trim().optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  createTaskCommentSchema,
  taskQuerySchema,
  taskStatusEnum,
  taskPriorityEnum,
};
