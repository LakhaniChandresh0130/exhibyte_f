"use strict";

module.exports = (sequelize, DataType) => {
  const TaskComment = sequelize.define(
    'TaskComment',
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
      authorId: {
        type: DataType.UUID,
        allowNull: false,
      },
      authorName: {
        type: DataType.STRING,
        allowNull: false,
      },
      body: {
        type: DataType.TEXT,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ['taskId'] },
        { fields: ['projectId'] },
      ],
    },
  );

  return TaskComment;
};
