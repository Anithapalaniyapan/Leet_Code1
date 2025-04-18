module.exports = (sequelize, Sequelize) => {
  const Meeting = sequelize.define('meeting', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    meetingDate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    startTime: {
      type: Sequelize.TIME,
      allowNull: false
    },
    endTime: {
      type: Sequelize.TIME,
      allowNull: true
    },
    location: {
      type: Sequelize.STRING,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('scheduled', 'in-progress', 'completed', 'cancelled'),
      defaultValue: 'scheduled'
    },
    departmentId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    roleId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'References the role ID from the roles table (e.g., student or staff)'
    },
    year: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Academic year, required for student meetings'
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  });

  return Meeting;
};