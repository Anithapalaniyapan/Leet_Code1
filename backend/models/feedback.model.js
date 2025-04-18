module.exports = (sequelize, Sequelize) => {
  const Feedback = sequelize.define("feedback", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    rating: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    submittedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
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

  return Feedback;
};