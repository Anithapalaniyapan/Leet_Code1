module.exports = (sequelize, Sequelize) => {
  const MeetingAttendee = sequelize.define('meeting_attendee', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    meetingId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'meetings',
        key: 'id'
      }
    },
    role: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isIn: [['student', 'staff']]
      }
    },
    attended: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    attendanceTime: {
      type: Sequelize.DATE,
      allowNull: true
    },
    feedbackSubmitted: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  });

  return MeetingAttendee;
};