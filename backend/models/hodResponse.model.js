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