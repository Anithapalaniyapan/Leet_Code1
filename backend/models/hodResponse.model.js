module.exports = (sequelize, Sequelize) => {
  const HODResponse = sequelize.define("hod_response", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    response: {
      type: Sequelize.TEXT,
      allowNull: true // Making it nullable since HOD can choose not to respond
    },
    questionId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id'
      }
    },
    meetingId: {
      type: Sequelize.INTEGER,
      allowNull: true, // Some older responses might not have meeting ID
      references: {
        model: 'meetings',
        key: 'id'
      }
    },
    responded: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    respondedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    hodId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    departmentId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id'
      }
    }
  });

  return HODResponse;
}; 