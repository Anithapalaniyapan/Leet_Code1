const db = require('../models');
const Question = db.question;
const Department = db.department;
const User = db.user;
const Role = db.role;
const { Op } = require('sequelize');

// Create a new question
exports.createQuestion = async (req, res) => {
  try {
    // Validate request
    if (!req.body.text || !req.body.departmentId) {
      return res.status(400).send({ message: 'Required fields missing' });
    }

    // Check if department exists
    const department = await Department.findByPk(req.body.departmentId);
    if (!department) {
      return res.status(404).send({ message: 'Department not found' });
    }
    
    // Validate role if provided
    let role = req.body.role || 'both'; // Default role
    if (!['student', 'staff', 'both'].includes(role)) {
        return res.status(400).send({ message: 'Invalid role. Must be student, staff, or both' });
    }

    // Validate and set year only for student questions
    let year = null;
    if (role === 'student') {
      if (!req.body.year) {
        return res.status(400).send({ message: 'Year is required for student questions' });
      }
      year = req.body.year;
    }

    // Check if meetingId is provided and valid
    let meetingId = null;
    if (req.body.meetingId) {
      const meeting = await db.meeting.findByPk(req.body.meetingId);
      if (!meeting) {
        return res.status(404).send({ message: 'Meeting not found' });
      }
      meetingId = req.body.meetingId;
    }

    // Create question
    const question = await Question.create({
      text: req.body.text,
      year: year, // Will be null for staff and both roles
      departmentId: req.body.departmentId,
      createdBy: req.userId,
      role: role,
      active: true,
      meetingId: meetingId // Add meetingId to the question
    });

    // Fetch the created question with department info
    const questionWithDept = await Question.findByPk(question.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: db.meeting,
          as: 'meeting',
          attributes: ['id', 'title', 'meetingDate']
        }
      ]
    });

    res.status(201).send({
      message: 'Question created successfully',
      question: questionWithDept
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get all questions
exports.getAllQuestions = async (req, res) => {
  try {
    // Get user to determine their role
    const user = await User.findByPk(req.userId, {
      include: [{
        model: Role,
        as: 'primaryRole',
        attributes: ['id', 'name']
      }]
    });
    
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    
    // Determine which questions to show based on user's primary role
    let whereCondition = {
      active: true
    };
    
    // If user has a primary role
    if (user.primaryRole) {
      const roleName = user.primaryRole.name.toLowerCase();
      
      // For students and staff, filter by their role
      if (roleName === 'student' || roleName === 'staff') {
        whereCondition.role = roleName;
        
        // For students, also match their department and year if available
        if (roleName === 'student' && user.departmentId && user.year) {
          whereCondition.departmentId = user.departmentId;
          whereCondition.year = user.year;
        }
        // For staff, match their department if available
        else if (roleName === 'staff' && user.departmentId) {
          whereCondition.departmentId = user.departmentId;
        }
      }
      // For academic directors and executive directors, show all questions
      // by not applying any role filter
    }
    
    const questions = await Question.findAll({
      where: whereCondition,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: db.meeting,
          as: 'meeting',
          attributes: ['id', 'title', 'status', 'meetingDate']
        }
      ],
      attributes: [
        'id',
        'text',
        'role',
        'departmentId',
        'year',
        'active',
        'meetingId',
        'createdAt',
        'updatedAt'
      ]
    });

    // Format questions for frontend
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      text: q.text,
      targetRole: q.role,
      departmentId: q.departmentId,
      department: q.department ? q.department.name : null,
      year: q.year,
      roleId: q.role === 'student' ? 1 : q.role === 'staff' ? 2 : 3,
      active: q.active,
      meetingId: q.meetingId,
      meeting: q.meeting ? {
        id: q.meeting.id,
        title: q.meeting.title,
        status: q.meeting.status,
        date: q.meeting.meetingDate
      } : null
    }));

    res.status(200).send(formattedQuestions);
  } catch (error) {
    console.error('Error in getAllQuestions:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get questions by department and year
exports.getQuestionsByDepartmentAndYear = async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    const role = req.query.role;
    const year = req.params.year;
    
    // Build the where condition
    let whereCondition = {
      departmentId: departmentId,
      active: true
    };

    // Add role condition if provided
    if (role) {
      if (role === 'staff') {
        // For staff questions
        whereCondition.role = {
          [db.Sequelize.Op.or]: ['staff', 'both']
        };
      } else if (role === 'student') {
        // For student questions
        whereCondition.role = {
          [db.Sequelize.Op.or]: ['student', 'both']
        };
        if (year) {
          whereCondition.year = year;
        }
      }
    } else if (year) {
      // If no role specified but year is specified, include student and both roles
      whereCondition.role = {
        [db.Sequelize.Op.or]: ['student', 'both']
      };
      whereCondition.year = year;
    }

    console.log('Query conditions:', whereCondition); // Add this for debugging
    
    const questions = await Question.findAll({
      where: whereCondition,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: db.meeting,
          as: 'meeting',
          attributes: ['id', 'title', 'status', 'meetingDate']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log('Found questions:', questions.length); // Add this for debugging

    // Format questions for frontend
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      text: q.text,
      targetRole: q.role,
      departmentId: q.departmentId,
      department: q.department ? q.department.name : null,
      year: q.year,
      roleId: q.role === 'student' ? 1 : q.role === 'staff' ? 2 : 3,
      active: q.active,
      meetingId: q.meetingId,
      meeting: q.meeting ? {
        id: q.meeting.id,
        title: q.meeting.title,
        status: q.meeting.status,
        date: q.meeting.meetingDate
      } : null
    }));

    res.status(200).send(formattedQuestions);
  } catch (error) {
    console.error('Error in getQuestionsByDepartmentAndYear:', error);
    res.status(500).send({ message: error.message });
  }
};

// Update a question
exports.updateQuestion = async (req, res) => {
  try {
    const id = req.params.id;
    const question = await Question.findByPk(id);

    if (!question) {
      return res.status(404).send({ message: 'Question not found' });
    }

    // Validate role if provided
    if (req.body.role && !['student', 'staff', 'both'].includes(req.body.role)) {
      return res.status(400).send({ message: 'Invalid role. Must be student, staff, or both' });
    }

    // Update question
    await question.update({
      text: req.body.text || question.text,
      year: req.body.year || question.year,
      departmentId: req.body.departmentId || question.departmentId,
      role: req.body.role || question.role,
      active: req.body.active !== undefined ? req.body.active : question.active
    });

    res.status(200).send({
      message: 'Question updated successfully',
      question: question
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if user is an Academic Director
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Only Academic Directors or Executive Directors can delete questions' });
    }
    
    const question = await Question.findByPk(id);

    if (!question) {
      return res.status(404).send({ message: 'Question not found' });
    }

    // Delete related feedback first
    await db.feedback.destroy({
      where: { questionId: id }
    });
    
    console.log(`Deleted feedback for question with ID: ${id}`);

    // Then delete the question
    await question.destroy();
    
    res.status(200).send({ 
      message: 'Question and related feedback deleted successfully',
      deletedQuestionId: id
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get questions created by a specific user
exports.getQuestionsByCreator = async (req, res) => {
  try {
    const creatorId = req.params.creatorId;

    const questions = await Question.findAll({
      where: { createdBy: creatorId },
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }]
    });

    res.status(200).send(questions);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get questions by meeting ID
exports.getQuestionsByMeeting = async (req, res) => {
  try {
    const meetingId = req.params.meetingId;
    
    if (!meetingId) {
      return res.status(400).send({ message: 'Meeting ID is required' });
    }
    
    // Check if meeting exists
    const meeting = await db.meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }
    
    // Get questions for this meeting
    const questions = await Question.findAll({
      where: { 
        meetingId: meetingId,
        active: true
      },
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    // Format questions for frontend
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      text: q.text,
      targetRole: q.role,
      departmentId: q.departmentId,
      department: q.department ? q.department.name : null,
      year: q.year,
      roleId: q.role === 'student' ? 1 : q.role === 'staff' ? 2 : 3,
      active: q.active,
      meetingId: q.meetingId
    }));
    
    res.status(200).send(formattedQuestions);
  } catch (error) {
    console.error('Error fetching questions by meeting:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get questions that are available for meetings starting within 5 minutes
exports.getAvailableQuestions = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user details to filter questions correctly
    const user = await db.user.findByPk(userId, {
      include: [
        {
          model: db.department,
          as: 'department'
        }
      ]
    });
    
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    
    // Get current date and time
    const now = new Date();
    
    // Calculate the cutoff time (now + 5 minutes)
    const cutoffTime = new Date(now.getTime() + (5 * 60 * 1000));
    
    // Format dates for SQL query
    const nowDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const nowTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
    
    // Find meetings that:
    // 1. Match the user's role, department, and year
    // 2. Are scheduled to start between now and the next 5 minutes
    const meetings = await db.meeting.findAll({
      where: {
        // Meeting role matches user's role (for student, roleId = 1)
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
        
        // Meeting starts between now and 5 minutes from now
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
      ]
    });
    
    if (meetings.length === 0) {
      return res.status(200).send([]);
    }
    
    // Get the closest upcoming meeting
    const upcomingMeeting = meetings[0];
    
    // Get questions for this meeting
    const questions = await Question.findAll({
      where: { 
        meetingId: upcomingMeeting.id,
        active: true
      },
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    // Format questions for frontend
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      text: q.text,
      targetRole: q.role,
      departmentId: q.departmentId,
      department: q.department ? q.department.name : null,
      year: q.year,
      roleId: q.role === 'student' ? 1 : q.role === 'staff' ? 2 : 3,
      active: q.active,
      meetingId: q.meetingId,
      meeting: {
        id: upcomingMeeting.id,
        title: upcomingMeeting.title,
        date: upcomingMeeting.meetingDate,
        startTime: upcomingMeeting.startTime
      }
    }));
    
    res.status(200).send(formattedQuestions);
  } catch (error) {
    console.error('Error getting available questions:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get questions for a specific meeting, but only if it's within 5 minutes of starting
exports.getQuestionsForMeetingIfAvailable = async (req, res) => {
  try {
    const meetingId = req.params.meetingId;
    const userId = req.userId;
    
    if (!meetingId) {
      return res.status(400).send({ message: 'Meeting ID is required' });
    }
    
    // Check if meeting exists
    const meeting = await db.meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }
    
    // Check if meeting is within 5 minutes of starting
    const now = new Date();
    const meetingDateTime = new Date(`${meeting.meetingDate}T${meeting.startTime}`);
    
    // Calculate time difference in milliseconds
    const diffMs = meetingDateTime - now;
    
    // If meeting is more than 5 minutes away or has already passed, don't show questions
    if (diffMs < 0 || diffMs > 5 * 60 * 1000) {
      return res.status(200).send({ 
        message: 'Questions not available yet. They will be available 5 minutes before the meeting.',
        availableIn: Math.floor(diffMs / 60000) - 5
      });
    }
    
    // Get questions for this meeting
    const questions = await Question.findAll({
      where: { 
        meetingId: meetingId,
        active: true
      },
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    // Format questions for frontend
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      text: q.text,
      targetRole: q.role,
      departmentId: q.departmentId,
      department: q.department ? q.department.name : null,
      year: q.year,
      roleId: q.role === 'student' ? 1 : q.role === 'staff' ? 2 : 3,
      active: q.active,
      meetingId: q.meetingId,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        date: meeting.meetingDate,
        startTime: meeting.startTime
      }
    }));
    
    res.status(200).send(formattedQuestions);
  } catch (error) {
    console.error('Error fetching questions by meeting availability:', error);
    res.status(500).send({ message: error.message });
  }
};