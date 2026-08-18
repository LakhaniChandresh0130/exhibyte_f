"use strict";

module.exports = (sequelize, DataType) => {
  const Task = sequelize.define(
    'Task',
    {
      id: {
        type: DataType.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
      },
      projectId: {
        type: DataType.UUID,
        allowNull: false,
      },
      title: {
        type: DataType.STRING,
        allowNull: false,
      },
      description: {
        type: DataType.TEXT,
      },
      status: {
        type: DataType.ENUM('todo', 'in_progress', 'in_review', 'done'),
        defaultValue: 'todo',
      },
      priority: {
        type: DataType.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
      },
      assigneeId: {
        type: DataType.UUID,
      },
      createdById: {
        type: DataType.UUID,
        allowNull: false,
      },
      dueDate: {
        type: DataType.DATE,
      },
      isArchived: {
        type: DataType.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ['projectId'] },
        { fields: ['status'] },
        { fields: ['assigneeId'] },
        { fields: ['projectId', 'title'], unique: true },
      ],
    },
  );

  return Task;
};
