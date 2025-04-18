const dbConfig = require('../config/db.config.js');
const Sequelize = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

// Initialize db object
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.user = require('./user.model.js')(sequelize, Sequelize);
db.role = require('./role.model.js')(sequelize, Sequelize);
db.department = require('./department.model.js')(sequelize, Sequelize);
db.question = require('./question.model.js')(sequelize, Sequelize);
db.feedback = require('./feedback.model.js')(sequelize, Sequelize);
db.meeting = require('./meeting.model.js')(sequelize, Sequelize);
db.meetingMinutes = require('./meetingMinutes.model.js')(sequelize, Sequelize);
db.meetingAttendee = require('./meetingAttendee.model.js')(sequelize, Sequelize);
db.hodResponse = require('./hodResponse.model.js')(sequelize, Sequelize);

// Define relationships

// User-Role relationship (Many-to-Many)
db.role.belongsToMany(db.user, {
  through: 'user_roles',
  foreignKey: 'roleId',
  otherKey: 'userId'
});

db.user.belongsToMany(db.role, {
  through: 'user_roles',
  foreignKey: 'userId',
  otherKey: 'roleId'
});

// User-Primary Role relationship (One-to-One)
db.role.hasMany(db.user, {
  foreignKey: 'roleId',
  as: 'primaryUsers'
});

db.user.belongsTo(db.role, {
  foreignKey: 'roleId',
  as: 'primaryRole'
});

// User-Department relationship
db.department.hasMany(db.user, { as: 'users' });
db.user.belongsTo(db.department, {
  foreignKey: 'departmentId',
  as: 'department'
});

// Question-Department relationship
db.department.hasMany(db.question, { as: 'questions' });
db.question.belongsTo(db.department, {
  foreignKey: 'departmentId',
  as: 'department'
});

// Department-Role relationship
db.department.belongsTo(db.role, {
  foreignKey: 'roleId',
  as: 'role'
});
db.role.hasMany(db.department, {
  foreignKey: 'roleId',
  as: 'departments'
});

// Feedback relationships
db.user.hasMany(db.feedback, { as: 'feedbacks' });
db.feedback.belongsTo(db.user, {
  foreignKey: 'userId',
  as: 'user'
});

db.question.hasMany(db.feedback, { as: 'feedbacks' });
db.feedback.belongsTo(db.question, {
  foreignKey: 'questionId',
  as: 'question'
});

// Meeting relationships
db.department.hasMany(db.meeting, { as: 'meetings' });
db.meeting.belongsTo(db.department, {
  foreignKey: 'departmentId',
  as: 'department'
});

db.user.hasMany(db.meeting, { as: 'createdMeetings', foreignKey: 'createdBy' });
db.meeting.belongsTo(db.user, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// Meeting Minutes relationships
db.meeting.hasMany(db.meetingMinutes, { as: 'minutes' });
db.meetingMinutes.belongsTo(db.meeting, {
  foreignKey: 'meetingId',
  as: 'meeting'
});

db.user.hasMany(db.meetingMinutes, { as: 'createdMinutes', foreignKey: 'createdBy' });
db.meetingMinutes.belongsTo(db.user, {
  foreignKey: 'createdBy',
  as: 'creator'
});

db.user.hasMany(db.meetingMinutes, { as: 'updatedMinutes', foreignKey: 'updatedBy' });
db.meetingMinutes.belongsTo(db.user, {
  foreignKey: 'updatedBy',
  as: 'updater'
});

// Meeting Attendee relationships
db.meeting.belongsToMany(db.user, {
  through: db.meetingAttendee,
  foreignKey: 'meetingId',
  otherKey: 'userId',
  as: 'attendees'
});

db.user.belongsToMany(db.meeting, {
  through: db.meetingAttendee,
  foreignKey: 'userId',
  otherKey: 'meetingId',
  as: 'attendedMeetings'
});

// Feedback-Meeting relationship
db.meeting.hasMany(db.feedback, { as: 'feedbacks' });
db.feedback.belongsTo(db.meeting, {
  foreignKey: 'meetingId',
  as: 'meeting'
});

// HOD Response relationships
db.question.hasOne(db.hodResponse, {
  foreignKey: 'questionId',
  as: 'hodResponse'
});
db.hodResponse.belongsTo(db.question, {
  foreignKey: 'questionId',
  as: 'question'
});

db.user.hasMany(db.hodResponse, {
  foreignKey: 'hodId',
  as: 'hodResponses'
});
db.hodResponse.belongsTo(db.user, {
  foreignKey: 'hodId',
  as: 'hod'
});

db.department.hasMany(db.hodResponse, {
  foreignKey: 'departmentId',
  as: 'hodResponses'
});
db.hodResponse.belongsTo(db.department, {
  foreignKey: 'departmentId',
  as: 'department'
});

// Pre-defined roles
db.ROLES = ['student', 'staff', 'academic_director', 'executive_director', 'hod'];

module.exports = db;