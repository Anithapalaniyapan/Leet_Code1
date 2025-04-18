module.exports = (sequelize, Sequelize) => {
  const MeetingMinutes = sequelize.define('meetingMinutes', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    meetingId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    attachments: {
      type: Sequelize.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('attachments');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('attachments', JSON.stringify(value));
      }
    },
    createdBy: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    updatedBy: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  return MeetingMinutes;
};