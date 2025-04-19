const db = require('../models');
const Meeting = db.meeting;
const User = db.user;
const Department = db.department;

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
    const meeting = await Meeting.findByPk(req.params.id, {
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
      ]
    });

    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }

    res.status(200).send(meeting);
  } catch (error) {
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
    // Get the current user with roles and department
    const user = await User.findByPk(req.userId, {
      include: [
        {
          model: db.role,
          as: 'primaryRole',
          attributes: ['id', 'name']
        },
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

    // Get user details
    const userRole = user.primaryRole?.name;
    const departmentId = user.department?.id;
    const year = user.year; // If your user model has year field

    console.log(`Getting meetings for user: ${user.username}, role: ${userRole}, department: ${departmentId}, year: ${year}`);

    // Build where clause based on user details
    const whereClause = {
      departmentId: departmentId
    };

    // If user is a student
    if (userRole === 'student') {
      whereClause.roleId = 1; // For student meetings
      if (year) {
        whereClause.year = year;
      }
    } 
    // If user is a staff
    else if (userRole === 'staff') {
      whereClause.roleId = 2; // For staff meetings
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
      userDetails: {
        id: user.id,
        username: user.username,
        role: userRole,
        department: user.department?.name,
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