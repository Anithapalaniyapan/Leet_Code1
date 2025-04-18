const db = require('../models');
const MeetingAttendee = db.meetingAttendee;
const User = db.user;
const Meeting = db.meeting;
const Feedback = db.feedback;

// Add attendees to a meeting
exports.addAttendees = async (req, res) => {
  try {
    const { meetingId, userIds, role } = req.body;
    
    if (!meetingId || !userIds || !Array.isArray(userIds) || !role) {
      return res.status(400).send({ message: 'Meeting ID, role, and array of user IDs are required' });
    }

    // Validate role
    if (!['student', 'staff'].includes(role.toLowerCase())) {
      return res.status(400).send({ message: 'Invalid role. Must be either "student" or "staff"' });
    }
    
    // Check if meeting exists
    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }
    
    // Create attendee records
    const attendeeRecords = [];
    for (const userId of userIds) {
      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        continue; // Skip invalid users
      }
      
      // Check if already an attendee
      const existingAttendee = await MeetingAttendee.findOne({
        where: { meetingId, userId }
      });
      
      if (!existingAttendee) {
        const attendee = await MeetingAttendee.create({
          meetingId,
          userId,
          role: role.toLowerCase(),
          attended: false,
          feedbackSubmitted: false
        });
        attendeeRecords.push(attendee);
      }
    }
    
    res.status(201).send({
      message: 'Attendees added successfully',
      attendees: attendeeRecords
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get all attendees for a meeting
exports.getMeetingAttendees = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    const attendees = await MeetingAttendee.findAll({
      where: { meetingId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'email']
        }
      ]
    });
    
    res.status(200).send(attendees);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Mark attendance for a meeting
exports.markAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.userId; // From JWT middleware
    
    // Find the attendee record
    const attendee = await MeetingAttendee.findOne({
      where: { meetingId, userId }
    });
    
    if (!attendee) {
      return res.status(404).send({ message: 'You are not registered for this meeting' });
    }
    
    // Update attendance
    await attendee.update({
      attended: true,
      attendanceTime: new Date()
    });
    
    res.status(200).send({
      message: 'Attendance marked successfully',
      attendee
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get meetings for a user (student/staff)
exports.getUserMeetings = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware
    
    const attendances = await MeetingAttendee.findAll({
      where: { userId },
      include: [
        {
          model: Meeting,
          as: 'meeting',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'fullName']
            }
          ]
        }
      ]
    });
    
    // Categorize meetings
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const pastMeetings = [];
    const todayMeetings = [];
    const upcomingMeetings = [];
    
    attendances.forEach(attendance => {
      const meeting = attendance.meeting;
      const meetingDate = new Date(meeting.meetingDate);
      const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
      
      const meetingInfo = {
        meeting,
        attended: attendance.attended,
        feedbackSubmitted: attendance.feedbackSubmitted,
        role: attendance.role
      };
      
      if (meetingDateOnly < today) {
        pastMeetings.push(meetingInfo);
      } else if (meetingDateOnly.getTime() === today.getTime()) {
        todayMeetings.push(meetingInfo);
      } else {
        upcomingMeetings.push(meetingInfo);
      }
    });
    
    res.status(200).send({
      pastMeetings,
      todayMeetings,
      upcomingMeetings
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Mark feedback as submitted
exports.markFeedbackSubmitted = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.userId; // From JWT middleware
    
    // Find the attendee record
    const attendee = await MeetingAttendee.findOne({
      where: { meetingId, userId }
    });
    
    if (!attendee) {
      return res.status(404).send({ message: 'You are not registered for this meeting' });
    }
    
    if (!attendee.attended) {
      return res.status(400).send({ message: 'You must attend the meeting before submitting feedback' });
    }
    
    // Update feedback status
    await attendee.update({
      feedbackSubmitted: true
    });
    
    res.status(200).send({
      message: 'Feedback status updated successfully',
      attendee
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};