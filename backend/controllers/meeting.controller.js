const db = require('../models');
const Meeting = db.meeting;
const User = db.user;
const Department = db.department;
const { Op } = require('sequelize');

// Create a new meeting
exports.createMeeting = async (req, res) => {
  try {
    // Validate all required fields
    const requiredFields = ['title', 'meetingDate', 'startTime', 'endTime', 'departmentId', 'role'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).send({ 
        message: `Required fields missing: ${missingFields.join(', ')}` 
      });
    }

    // Convert role to numeric if it's a string
    const roleId = typeof req.body.role === 'string' ? parseInt(req.body.role) : req.body.role;
    
    // Validate year for student role (roleId 1)
    if (roleId === 1 && !req.body.year) {
      return res.status(400).send({ 
        message: 'Year is required for student meetings' 
      });
    }

    // Create meeting
    const meeting = await Meeting.create({
      title: req.body.title,
      description: req.body.description || null,
      meetingDate: req.body.meetingDate,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      location: req.body.location || null,
      status: req.body.status || 'scheduled',
      departmentId: req.body.departmentId,
      roleId: roleId, // Use roleId field instead of role
      year: req.body.year || null, // Add year field to match database structure
      createdBy: req.userId // From JWT middleware
    });

    // Send Email Notification
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Fetch department name
    const department = await Department.findByPk(req.body.departmentId);

    // Get recipients based on role & department
    const recipients = await User.findAll({
      where: {
        roleId: roleId,
        departmentId: req.body.departmentId,
        ...(roleId === 1 ? { year: req.body.year } : {})
      },
      attributes: ['email']
    });

    const emailList = recipients.map(user => user.email).filter(Boolean); // array of emails

    const mailOptions = {
      from: `"Admin" <${process.env.EMAIL_USER}>`,
      to: emailList.join(','), // Use the actual email list array, not the string "emailList"
      subject: `📅🎯 New Meeting Scheduled: ${req.body.title}`,
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #2e6c80;">📌 New Meeting Scheduled</h2>
        <p>Hello ${roleId === 1 ? 'Students' : 'Staff'},</p>
        <p>A new meeting has been scheduled for <strong>${department?.name || 'your department'}</strong>.</p>

        <table style="width: 100%; border-collapse: collapse;">
          <tr><td><strong>📝 Title:</strong></td><td>${req.body.title}</td></tr>
          <tr><td><strong>📄 Description:</strong></td><td>${req.body.description || 'N/A'}</td></tr>
          <tr><td><strong>📆 Date:</strong></td><td>${req.body.meetingDate}</td></tr>
          <tr><td><strong>🕐 Time:</strong></td><td>${req.body.startTime} - ${req.body.endTime}</td></tr>
        </table>

        <p>Please be on time.</p>
        <br/>
        <p>Thanks,<br/><strong>Admin Team</strong></p>
      </div>
      `
    };

    if (emailList.length > 0) {
      try {
        await transporter.sendMail(mailOptions);
        console.log('Meeting email sent to:', emailList.join(', '));
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue with the response even if email fails
      }
    }

    // Return success response with created meeting data
    res.status(201).send({
      message: 'Meeting created successfully',
      meeting: meeting
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).send({ 
      message: 'Failed to create meeting',
      error: error.message 
    });
  }
};

// Get all meetings
exports.getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      order: [['meetingDate', 'DESC'], ['startTime', 'DESC']]
    });

    res.status(200).send(meetings);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get meetings by department
exports.getMeetingsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    if (!departmentId) {
      return res.status(400).send({
        message: "Department ID is required"
      });
    }

    const meetings = await Meeting.findAll({
      where: {
        departmentId: departmentId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['meetingDate', 'DESC'],  // Use meetingDate instead of date
        ['startTime', 'ASC']
      ]
    });

    if (!meetings || meetings.length === 0) {
      return res.status(200).send([]);
    }

    res.status(200).send(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving meetings."
    });
  }
};

// Get meetings by department and year
exports.getMeetingsByDepartmentAndYear = async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const whereClause = {};
    if (departmentId) whereClause.departmentId = departmentId;

    const meetings = await Meeting.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      order: [['meetingDate', 'DESC'], ['startTime', 'DESC']]
    });

    // Categorize meetings
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const pastMeetings = [];
    const currentMeetings = [];
    const futureMeetings = [];
    
    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.meetingDate);
      
      // Compare dates only (not time)
      const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
      
      if (meetingDateOnly < today) {
        pastMeetings.push(meeting);
      } else if (meetingDateOnly.getTime() === today.getTime()) {
        currentMeetings.push(meeting);
      } else {
        futureMeetings.push(meeting);
      }
    });

    res.status(200).send({
      pastMeetings,
      currentMeetings,
      futureMeetings
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get meeting by ID
exports.getMeetingById = async (req, res) => {
  try {
    const meetingId = req.params.id;
    
    const meeting = await Meeting.findByPk(meetingId, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'username', 'fullName', 'email']
        },
        {
          model: db.question,
          as: 'questions',
          attributes: ['id', 'text', 'role', 'year', 'active']
        }
      ]
    });
    
    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }
    
    res.status(200).send(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).send({ message: error.message });
  }
};

// Update meeting
exports.updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);

    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }

    // Check if date or time is being updated
    const isDateTimeChanged = (
      (req.body.meetingDate && req.body.meetingDate !== meeting.meetingDate) ||
      (req.body.startTime && req.body.startTime !== meeting.startTime) ||
      (req.body.endTime && req.body.endTime !== meeting.endTime)
    );

    // If date or time is changed and the user is an Academic Director, update status to 'rescheduled'
    if (isDateTimeChanged && req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR')) {
      req.body.status = 'rescheduled';
    }

    await meeting.update(req.body);

    res.status(200).send({
      message: 'Meeting updated successfully',
      meeting: meeting
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Delete meeting (hard delete)
exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);

    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }

    // Hard delete
    await meeting.destroy();

    res.status(200).send({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get meetings for the current user based on role, department, and year
exports.getMeetingsForCurrentUser = async (req, res) => {
  try {
    // Get the current user
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Get roles and department info
    const roles = await user.getRoles();
    const userRoles = roles.map(role => role.name);
    
    // Get department info
    let departmentId = null;
    if (user.departmentId) {
      departmentId = user.departmentId;
    }
    
    // Get user year if available
    const year = user.year;

    console.log(`Getting meetings for user: ${user.username}, roles: ${userRoles.join(',')}, department: ${departmentId}, year: ${year}`);

    // Build where clause based on user details
    const whereClause = {};
    
    // If user has department, filter by it
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    // Role-specific filters
    if (userRoles.includes('student')) {
      whereClause.roleId = 1; // For student meetings
      if (year) {
        whereClause.year = year;
      }
    } 
    else if (userRoles.includes('staff')) {
      whereClause.roleId = 2; // For staff meetings
    }
    else if (userRoles.includes('hod')) {
      whereClause.roleId = 3; // For HOD meetings
    }
    // For directors, don't filter by role

    console.log('Filter criteria:', whereClause);

    // Fetch meetings based on filters
    const meetings = await Meeting.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      order: [['meetingDate', 'DESC'], ['startTime', 'DESC']]
    });

    // Categorize meetings and update status if needed
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    
    const pastMeetings = [];
    const currentMeetings = [];
    const futureMeetings = [];
    
    const meetingsToUpdate = [];
    
    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.meetingDate);
      
      // Compare dates only (not time)
      const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
      
      // Extract meeting time in minutes for comparison
      const meetingEndTime = meeting.endTime ? meeting.endTime.split(':') : meeting.startTime.split(':');
      const meetingEndMinutes = parseInt(meetingEndTime[0]) * 60 + parseInt(meetingEndTime[1]);

      // Check if the meeting has passed
      const meetingHasPassed = 
        meetingDateOnly < today || 
        (meetingDateOnly.getTime() === today.getTime() && meetingEndMinutes < currentTime);

      // Auto-update status to completed if meeting has passed and status is still scheduled or rescheduled
      if (meetingHasPassed && (meeting.status === 'scheduled' || meeting.status === 'rescheduled' || meeting.status === 'in-progress')) {
        meeting.status = 'completed';
        meetingsToUpdate.push({ id: meeting.id, status: 'completed' });
      }
      
      if (meetingDateOnly < today) {
        pastMeetings.push(meeting);
      } else if (meetingDateOnly.getTime() === today.getTime()) {
        currentMeetings.push(meeting);
      } else {
        futureMeetings.push(meeting);
      }
    });

    // Update meeting statuses in database
    if (meetingsToUpdate.length > 0) {
      console.log(`Updating status for ${meetingsToUpdate.length} meetings to 'completed'`);
      for (const update of meetingsToUpdate) {
        await Meeting.update({ status: update.status }, { where: { id: update.id } });
      }
    }

    res.status(200).send({
      userDetails: {
        id: user.id,
        username: user.username,
        roles: userRoles,
        departmentId: departmentId,
        year: year
      },
      pastMeetings,
      currentMeetings,
      futureMeetings
    });
  } catch (error) {
    console.error('Error getting user meetings:', error);
    res.status(500).send({ 
      message: 'Failed to get meetings for current user',
      error: error.message 
    });
  }
};

// Update status of all meetings that have passed
exports.updateMeetingStatuses = async () => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    // Find all scheduled or rescheduled meetings that have ended
    const meetings = await Meeting.findAll({
      where: {
        status: ['scheduled', 'rescheduled', 'in-progress'],
        [db.Sequelize.Op.or]: [
          {
            meetingDate: { [db.Sequelize.Op.lt]: today }
          },
          {
            meetingDate: today,
            endTime: { [db.Sequelize.Op.lt]: currentTime }
          }
        ]
      }
    });

    console.log(`Found ${meetings.length} meetings to update to 'completed'`);

    // Update their status to 'completed'
    for (const meeting of meetings) {
      await meeting.update({ status: 'completed' });
    }

    return { updated: meetings.length };
  } catch (error) {
    console.error('Error updating meeting statuses:', error);
    return { error: error.message };
  }
};

// Add a new endpoint to get meetings starting within a specific time window
exports.getUpcomingMeetingsWithinMinutes = async (req, res) => {
  try {
    const minutes = parseInt(req.params.minutes) || 5; // Default to 5 minutes if not specified
    const userId = req.userId;
    
    // Get user details to filter meetings correctly
    const user = await db.user.findByPk(userId, {
      include: [
        {
          model: db.department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    
    // Get current date and time
    const now = new Date();
    
    // Calculate the cutoff time (now + minutes)
    const cutoffTime = new Date(now.getTime() + (minutes * 60 * 1000));
    
    // Format dates for SQL query
    const nowDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const nowTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
    
    // Find meetings that:
    // 1. Match the user's role, department, and year
    // 2. Are scheduled to start between now and the cutoff time
    // 3. Haven't been completed or cancelled
    const meetings = await db.meeting.findAll({
      where: {
        // Match user's role (for student, roleId = 1)
        roleId: 1, // Assuming 1 is for students
        
        // Match user's department or is for all departments
        [Op.or]: [
          { departmentId: user.department?.id },
          { departmentId: null }
        ],
        
        // Match user's year or is for all years
        [Op.or]: [
          { year: user.year },
          { year: null }
        ],
        
        // Meeting date is today
        meetingDate: nowDate,
        
        // Meeting starts between now and cutoff time
        [Op.and]: [
          { startTime: { [Op.gte]: nowTime } },
          { startTime: { [Op.lte]: cutoffTime.toTimeString().split(' ')[0] } }
        ],
        
        // Not completed or cancelled
        status: { [Op.notIn]: ['completed', 'cancelled'] }
      },
      order: [
        ['meetingDate', 'ASC'],
        ['startTime', 'ASC']
      ],
      include: [
        {
          model: db.department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.status(200).send(meetings);
  } catch (error) {
    console.error('Error getting upcoming meetings:', error);
    res.status(500).send({ message: error.message });
  }
};

// Mark meeting as responded by HOD
exports.markMeetingRespondedByHOD = async (req, res) => {
  try {
    const { id: meetingId } = req.params;
    const { departmentId } = req.body;
    const hodId = req.userId;

    if (!meetingId || !departmentId) {
      return res.status(400).send({
        message: "Meeting ID and Department ID are required"
      });
    }

    // Check if the meeting exists
    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).send({
        message: `Meeting with ID ${meetingId} not found`
      });
    }

    // Create or update the meeting response record
    const HODResponse = db.hodResponse || db.HodResponse; // Handle different casings
    
    if (!HODResponse) {
      // If HODResponse model doesn't exist yet, create a simple tracking in meeting_hod_responses table
      await db.sequelize.query(
        `INSERT INTO meeting_hod_responses (meeting_id, hod_id, department_id, created_at, updated_at) 
         VALUES (?, ?, ?, NOW(), NOW()) 
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        {
          replacements: [meetingId, hodId, departmentId],
          type: db.sequelize.QueryTypes.INSERT
        }
      );
    } else {
      // Use the model if it exists
      const [response, created] = await HODResponse.findOrCreate({
        where: {
          meetingId: meetingId,
          hodId: hodId,
          departmentId: departmentId
        },
        defaults: {
          responded: true,
          respondedAt: new Date()
        }
      });
      
      // If record already existed, update the responded timestamp
      if (!created) {
        response.responded = true;
        response.respondedAt = new Date();
        await response.save();
      }
    }

    // Return success response
    res.status(200).send({
      message: 'Meeting marked as responded by HOD successfully',
      meetingId: meetingId,
      departmentId: departmentId,
      hodId: hodId
    });
  } catch (error) {
    console.error('Error marking meeting as responded by HOD:', error);
    res.status(500).send({ 
      message: 'Failed to mark meeting as responded',
      error: error.message 
    });
  }
};