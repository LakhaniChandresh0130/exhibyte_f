"use strict";

const { Sequelize, DataTypes, Op, literal } = require("sequelize");
const logger = require("../utils/logger");

let sequelize;

/**
 * Production-optimized Sequelize configuration
 * - Connection pooling for multiple server deployments
 * - Optimized for high throughput
 * - Built-in query caching strategy
 */
sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    operatorsAliases: 1,
    dialectOptions: {
      // ssl: {
      //   require: true, // This will help you. But you will see nwe error
      //   rejectUnauthorized: false, // This line will fix new error
      // },
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: false,
  }
);

sequelize
  .authenticate()
  .then(() => {
    logger.info("Database connection established successfully");
  })
  .catch((err) => {
    logger.error(`Database connection error: ${err.message}`);
  });

const db = {};

db.Project = require("./project.js")(sequelize, DataTypes);
db.Task = require("./task.js")(sequelize, DataTypes);
db.TaskComment = require("./taskComment.js")(sequelize, DataTypes);
db.TaskActivity = require("./taskActivity.js")(sequelize, DataTypes);

db.Project.hasMany(db.Task, {
  foreignKey: 'projectId',
  as: 'tasks',
  onDelete: 'CASCADE',
});
db.Task.belongsTo(db.Project, { foreignKey: 'projectId', as: 'project' });

db.Task.hasMany(db.TaskComment, {
  foreignKey: 'taskId',
  as: 'comments',
  onDelete: 'CASCADE',
});
db.TaskComment.belongsTo(db.Task, { foreignKey: 'taskId', as: 'task' });

db.Task.hasMany(db.TaskActivity, {
  foreignKey: 'taskId',
  as: 'activity',
  onDelete: 'CASCADE',
});
db.TaskActivity.belongsTo(db.Task, { foreignKey: 'taskId', as: 'task' });

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Op;
db.literal = literal;

// (async () => {
//   try {
//     await db.sequelize.sync({ alter: true });
//     logger.info('Database tables synced successfully');
//   } catch (error) {
//     logger.error(`Database sync failed: ${error.message}`);
//   }
// })();

module.exports = db;
