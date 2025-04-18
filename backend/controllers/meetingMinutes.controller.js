const db = require('../models');
const MeetingMinutes = db.meetingMinutes;
const Meeting = db.meeting;
const User = db.user;

// Create meeting minutes
exports.createMeetingMinutes = async (req, res) => {
  try {
    // Validate request
    if (!req.body.meetingId || !req.body.content) {
      return res.status(400).send({ message: 'Required fields missing' });
    }

    // Check if meeting exists
    const meeting = await Meeting.findByPk(req.body.meetingId);
    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }

    // Create meeting minutes
    const minutes = await MeetingMinutes.create({
      meetingId: req.body.meetingId,
      content: req.body.content,
      attachments: req.body.attachments || [],
      createdBy: req.userId, // From JWT middleware
      updatedBy: req.userId
    });

    res.status(201).send({
      message: 'Meeting minutes created successfully',
      minutes: minutes
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get meeting minutes by meeting ID
exports.getMeetingMinutesByMeetingId = async (req, res) => {
  try {
    const minutes = await MeetingMinutes.findAll({
      where: { meetingId: req.params.meetingId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Meeting,
          as: 'meeting',
          attributes: ['id', 'title', 'meetingDate', 'startTime', 'endTime', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).send(minutes);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get meeting minutes by ID
exports.getMeetingMinutesById = async (req, res) => {
  try {
    const minutes = await MeetingMinutes.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Meeting,
          as: 'meeting',
          attributes: ['id', 'title', 'meetingDate', 'startTime', 'endTime', 'status']
        }
      ]
    });

    if (!minutes) {
      return res.status(404).send({ message: 'Meeting minutes not found' });
    }

    res.status(200).send(minutes);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Update meeting minutes
exports.updateMeetingMinutes = async (req, res) => {
  try {
    const minutes = await MeetingMinutes.findByPk(req.params.id);

    if (!minutes) {
      return res.status(404).send({ message: 'Meeting minutes not found' });
    }

    // Update meeting minutes
    await minutes.update({
      ...req.body,
      updatedBy: req.userId
    });

    res.status(200).send({
      message: 'Meeting minutes updated successfully',
      minutes: minutes
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Delete meeting minutes
exports.deleteMeetingMinutes = async (req, res) => {
  try {
    const minutes = await MeetingMinutes.findByPk(req.params.id);

    if (!minutes) {
      return res.status(404).send({ message: 'Meeting minutes not found' });
    }

    await minutes.destroy();

    res.status(200).send({ message: 'Meeting minutes deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};