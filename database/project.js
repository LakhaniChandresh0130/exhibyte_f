"use strict";

module.exports = (sequelize, DataType) => {
  const Project = sequelize.define(
    'Project',
    {
      id: {
        type: DataType.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
      },
      name: {
        type: DataType.STRING,
        allowNull: false,
      },
      description: {
        type: DataType.TEXT,
      },
      ownerId: {
        type: DataType.UUID,
        allowNull: false,
      },
      members: {
        type: DataType.JSON,
        defaultValue: [],
      },
      status: {
        type: DataType.ENUM('active', 'archived'),
        defaultValue: 'active',
      },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ['ownerId'] },
        { fields: ['status'] },
      ],
    },
  );

  return Project;
};
