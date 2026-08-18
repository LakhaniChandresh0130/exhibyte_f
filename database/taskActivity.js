"use strict";

module.exports = (sequelize, DataType) => {
  const TaskActivity = sequelize.define(
    'TaskActivity',
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
      taskId: {
        type: DataType.UUID,
        allowNull: false,
      },
      actorId: {
        type: DataType.UUID,
        allowNull: false,
      },
      actorName: {
        type: DataType.STRING,
        allowNull: false,
      },
      action: {
        type: DataType.ENUM('task_created', 'status_changed', 'assignee_changed', 'comment_added'),
        allowNull: false,
      },
      details: {
        type: DataType.JSON,
        defaultValue: {},
      },
      createdAt: {
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
      },
    },
    {
      timestamps: false,
      indexes: [
        { fields: ['projectId'] },
        { fields: ['taskId'] },
        { fields: ['createdAt'] },
      ],
    },
  );

  return TaskActivity;
};
