module.exports = (sequelize, Sequelize) => {
  const Question = sequelize.define("question", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    text: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    year: {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    role: {
      type: Sequelize.ENUM('student', 'staff', 'both'),
      allowNull: false,
      defaultValue: 'both'
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    meetingId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'meetings',
        key: 'id'
      }
    }
  });

  return Question;
};