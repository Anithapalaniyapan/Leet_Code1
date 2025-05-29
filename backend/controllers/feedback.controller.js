const db = require('../models');
const Feedback = db.feedback;
const Question = db.question;
const User = db.user;
const Department = db.department;
const ExcelJS = require('exceljs'); // Add ExcelJS dependency for Excel generation

// Submit feedback
exports.submitFeedback = async (req, res) => {
  try {
    // Validate request
    if (!req.body.questionId || !req.body.rating) {
      return res.status(400).send({ message: 'Required fields missing' });
    }

    // Check if question exists
    const question = await Question.findByPk(req.body.questionId);
    if (!question) {
      return res.status(404).send({ message: 'Question not found' });
    }

    // Check if question is active
    if (!question.active) {
      return res.status(400).send({ message: 'This question is no longer active' });
    }

    // Get user information
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Check if user's department and year match the question's requirements
    if (question.departmentId !== user.departmentId) {
      return res.status(403).send({ message: 'You cannot submit feedback for a different department' });
    }

    if (question.year !== null && question.year !== user.year) {
      return res.status(403).send({ message: 'You cannot submit feedback for a different year' });
    }
    
    // Get user roles
    const roles = await user.getRoles();
    const userRoleNames = roles.map(role => role.name);
    
    // Check if user's role matches the question's role requirement
    if (question.role === 'student' && !userRoleNames.includes('student')) {
      return res.status(403).send({ message: 'This question is only for students' });
    }
    
    if (question.role === 'staff' && !userRoleNames.includes('staff')) {
      return res.status(403).send({ message: 'This question is only for staff' });
    }

    // Check if user has already submitted feedback for this question
    const existingFeedback = await Feedback.findOne({
      where: {
        userId: req.userId,
        questionId: req.body.questionId
      }
    });

    // Determine meetingId - use provided, or get from question, or null
    let meetingId = req.body.meetingId || question.meetingId || null;

    if (existingFeedback) {
      // Update existing feedback
      await existingFeedback.update({
        rating: req.body.rating,
        notes: req.body.notes || existingFeedback.notes,
        submittedAt: new Date(),
        meetingId: meetingId
      });

      return res.status(200).send({
        message: 'Feedback updated successfully',
        feedback: existingFeedback
      });
    }

    // Create new feedback
    const feedback = await Feedback.create({
      rating: req.body.rating,
      notes: req.body.notes,
      userId: req.userId,
      questionId: req.body.questionId,
      meetingId: meetingId
    });

    // If this feedback is for a meeting, update the attendee record
    if (meetingId) {
      try {
        const attendee = await db.meetingAttendee.findOne({
          where: { meetingId, userId: req.userId }
        });
        
        if (attendee) {
          await attendee.update({ feedbackSubmitted: true });
        }
      } catch (attendeeError) {
        console.error('Error updating meeting attendee record:', attendeeError);
        // Don't fail the whole request if this part fails
      }
    }

    res.status(201).send({
      message: 'Feedback submitted successfully',
      feedback: feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get feedback by user
exports.getFeedbackByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;

    // Check if the requesting user has permission to view this user's feedback
    if (req.userId !== userId && !req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to view this feedback' });
    }

    const feedback = await Feedback.findAll({
      where: { userId: userId },
      include: [
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'text', 'year'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        },
        {
          model: db.meeting,
          as: 'meeting',
          attributes: ['id', 'title', 'meetingDate', 'startTime', 'endTime']
        }
      ]
    });

    res.status(200).send(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get feedback by question
exports.getFeedbackByQuestion = async (req, res) => {
  try {
    const questionId = req.params.questionId;

    // Check if user has permission to view feedback (academic director or executive director)
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to view feedback statistics' });
    }

    const feedback = await Feedback.findAll({
      where: { questionId: questionId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'year', 'departmentId'],
        include: [{
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }]
      }]
    });

    // Calculate statistics
    const totalResponses = feedback.length;
    let totalRating = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    feedback.forEach(item => {
      totalRating += item.rating;
      ratingDistribution[item.rating]++;
    });

    const averageRating = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 0;

    res.status(200).send({
      questionId: questionId,
      totalResponses: totalResponses,
      averageRating: averageRating,
      ratingDistribution: ratingDistribution,
      feedback: feedback
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get feedback statistics by department
exports.getFeedbackStatsByDepartment = async (req, res) => {
  try {
    const departmentId = req.params.departmentId;

    // Check if user has permission to view feedback (academic director or executive director)
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to view feedback statistics' });
    }

    // Get all questions for the department
    const questions = await Question.findAll({
      where: { departmentId: departmentId },
      include: [{
        model: Feedback,
        as: 'feedbacks'
      }]
    });

    // Calculate statistics
    let totalResponses = 0;
    let totalRating = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const questionStats = [];

    questions.forEach(question => {
      const questionResponses = question.feedbacks.length;
      let questionTotalRating = 0;
      
      question.feedbacks.forEach(feedback => {
        totalRating += feedback.rating;
        questionTotalRating += feedback.rating;
        ratingDistribution[feedback.rating]++;
      });

      totalResponses += questionResponses;
      
      questionStats.push({
        questionId: question.id,
        questionText: question.text,
        responses: questionResponses,
        averageRating: questionResponses > 0 ? (questionTotalRating / questionResponses).toFixed(2) : 0
      });
    });

    const averageRating = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 0;

    res.status(200).send({
      departmentId: departmentId,
      totalResponses: totalResponses,
      averageRating: averageRating,
      ratingDistribution: ratingDistribution,
      questionStats: questionStats
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get all feedback in descending order
exports.getAllFeedbackDescending = async (req, res) => {
  try {
    // Check if user has permission to view feedback (academic director or executive director)
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to view all feedback' });
    }

    const feedback = await Feedback.findAll({
      order: [['submittedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'year', 'departmentId'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        },
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'text', 'year', 'departmentId'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        },
        {
          model: db.meeting,
          as: 'meeting',
          attributes: ['id', 'title', 'meetingDate', 'startTime', 'endTime']
        }
      ]
    });

    res.status(200).send(feedback);
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get feedback by meeting
exports.getFeedbackByMeeting = async (req, res) => {
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
    
    // Get feedback for this meeting
    const feedback = await Feedback.findAll({
      where: { meetingId: meetingId },
      include: [
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'text', 'year'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'year', 'departmentId']
        }
      ]
    });

    res.status(200).send(feedback);
  } catch (error) {
    console.error('Error fetching feedback by meeting:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get feedback by meeting ID and user ID
exports.getFeedbackByMeetingAndUser = async (req, res) => {
  try {
    const meetingId = req.params.meetingId;
    const userId = req.userId; // Get the current user's ID from JWT

    if (!meetingId) {
      return res.status(400).send({ message: 'Meeting ID is required' });
    }

    // Check if meeting exists
    const meeting = await db.meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }

    // Get feedback for this meeting submitted by the current user
    const feedback = await Feedback.findAll({
      where: { 
        meetingId: meetingId,
        userId: userId 
      },
      include: [
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'text', 'year'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        }
      ]
    });

    if (!feedback || feedback.length === 0) {
      return res.status(404).send({ 
        message: 'No feedback found for this meeting and user',
        meetingId: meetingId,
        userId: userId
      });
    }

    res.status(200).send(feedback);
  } catch (error) {
    console.error('Error fetching feedback by meeting and user:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get overall feedback statistics (for academic and executive directors)
exports.getOverallFeedbackStats = async (req, res) => {
  try {
    // Check if user has academic or executive director role
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to view overall feedback statistics' });
    }

    // Check if meeting-specific filtering is requested
    const meetingId = req.query.meetingId;
    
    // Get all departments
    const departments = await Department.findAll({
      where: { active: true }
    });

    const departmentStats = [];
    let totalResponses = 0;
    let totalRating = 0;
    const overallRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    // Role-specific stats for executive director view
    const roleStats = {
      student: {
        totalResponses: 0,
        totalRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      staff: {
        totalResponses: 0,
        totalRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    };

    // Calculate statistics for each department
    for (const department of departments) {
      // Get all questions for the department
      const questionQuery = { 
        where: { departmentId: department.id },
        include: [{
          model: Feedback,
          as: 'feedbacks',
          where: {}  // Empty where clause to be filled conditionally
        }]
      };
      
      // Add meeting filter if meetingId is provided
      if (meetingId) {
        questionQuery.include[0].where.meetingId = meetingId;
      }
      
      const questions = await Question.findAll(questionQuery);

      let departmentResponses = 0;
      let departmentTotalRating = 0;
      const departmentRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      const questionStatsList = [];
      
      for (const question of questions) {
        let questionResponses = 0;
        let questionTotalRating = 0;
        const questionRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        for (const feedback of question.feedbacks) {
          // Get user info for role-based stats
          const user = await User.findByPk(feedback.userId);
          const isStaff = user && 
            (user.roleId === 2 || user.roleId === 3 || user.roleId === 4);
          const roleType = isStaff ? 'staff' : 'student';
          
          // Update role-specific stats
          roleStats[roleType].totalResponses++;
          roleStats[roleType].totalRating += feedback.rating;
          roleStats[roleType].ratingDistribution[feedback.rating]++;
          
          // Update general stats
          departmentTotalRating += feedback.rating;
          departmentRatingDistribution[feedback.rating]++;
          overallRatingDistribution[feedback.rating]++;
          departmentResponses++;
          
          // Update question stats
          questionTotalRating += feedback.rating;
          questionRatingDistribution[feedback.rating]++;
          questionResponses++;
        }
        
        // Add question stats if there are responses
        if (questionResponses > 0) {
          questionStatsList.push({
            questionId: question.id,
            questionText: question.text,
            totalResponses: questionResponses,
            averageRating: (questionTotalRating / questionResponses).toFixed(2),
            ratingDistribution: questionRatingDistribution
          });
        }
      }

      totalResponses += departmentResponses;
      totalRating += departmentTotalRating;

      // Only add departments with responses
      if (departmentResponses > 0) {
        departmentStats.push({
          departmentId: department.id,
          departmentName: department.name,
          responses: departmentResponses,
          averageRating: (departmentTotalRating / departmentResponses).toFixed(2),
          ratingDistribution: departmentRatingDistribution,
          questionStats: questionStatsList
        });
      }
    }

    const overallAverageRating = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 0;
    
    // Calculate average ratings for roles
    const studentAvgRating = roleStats.student.totalResponses > 0 
      ? (roleStats.student.totalRating / roleStats.student.totalResponses).toFixed(2) 
      : 0;
    
    const staffAvgRating = roleStats.staff.totalResponses > 0 
      ? (roleStats.staff.totalRating / roleStats.staff.totalResponses).toFixed(2) 
      : 0;

    res.status(200).send({
      totalResponses: totalResponses,
      overallAverageRating: overallAverageRating,
      overallRatingDistribution: overallRatingDistribution,
      departmentStats: departmentStats,
      roleStats: {
        student: {
          totalResponses: roleStats.student.totalResponses,
          averageRating: studentAvgRating,
          ratingDistribution: roleStats.student.ratingDistribution
        },
        staff: {
          totalResponses: roleStats.staff.totalResponses,
          averageRating: staffAvgRating,
          ratingDistribution: roleStats.staff.ratingDistribution
        }
      },
      // Include meeting info if filtered by meeting
      meetingId: meetingId || null
    });
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    res.status(500).send({ message: error.message });
  }
};

// Generate Excel report for all feedback
exports.generateAllFeedbackExcel = async (req, res) => {
  try {
    // Check if user has permission to view feedback (academic director or executive director)
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to generate reports' });
    }

    const feedback = await Feedback.findAll({
      order: [['submittedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'year', 'departmentId'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        },
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'text', 'year', 'departmentId'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        },
        {
          model: db.meeting,
          as: 'meeting',
          attributes: ['id', 'title', 'meetingDate', 'startTime', 'endTime']
        }
      ]
    });

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('All Feedback');

    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'User', key: 'user', width: 25 },
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Question', key: 'question', width: 50 },
      { header: 'Submitted Date', key: 'submittedAt', width: 20 },
      { header: 'Notes', key: 'notes', width: 50 }
    ];

    // Add data
    feedback.forEach(item => {
      worksheet.addRow({
        id: item.id || '',
        rating: item.rating || '',
        user: item.user?.fullName || item.user?.username || 'Anonymous',
        department: item.user?.department?.name || 'Unknown',
        question: item.question?.text || 'Unknown',
        submittedAt: item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '',
        notes: item.notes || ''
      });
    });

    // Add question analysis section
    worksheet.addRow([]);
    worksheet.addRow(['Question Analysis Section']);
    worksheet.addRow([]);
    worksheet.addRow(['Question ID', 'Question Text', 'Department', 'Total Responses', 'Average Rating']);
    
    // Process feedback data to calculate question stats
    const questionStats = {};
    
    feedback.forEach(item => {
      if (!item.question || !item.question.id) return;
      
      const questionId = item.question.id;
      
      // Initialize question stats object if it doesn't exist
      if (!questionStats[questionId]) {
        questionStats[questionId] = {
          id: questionId,
          text: item.question.text || 'Unknown Question',
          department: item.question?.department?.name || 'Unknown',
          responses: 0,
          totalRating: 0,
        };
      }
      
      // Update question stats
      questionStats[questionId].responses += 1;
      questionStats[questionId].totalRating += item.rating;
    });
    
    // Add question stats to worksheet
    Object.values(questionStats).forEach(question => {
      const averageRating = question.responses > 0 
        ? (question.totalRating / question.responses).toFixed(2) 
        : 'N/A';
      
      worksheet.addRow([
        question.id,
        question.text,
        question.department,
        question.responses,
        averageRating
      ]);
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    // Also make the question analysis header bold
    worksheet.getRow(worksheet.rowCount - Object.keys(questionStats).length - 2).font = { bold: true };

    // Style the header row
    worksheet.getRow(1).font = { bold: true };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=all_feedback_data.xlsx');

    // Send the workbook as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).send({ message: error.message });
  }
};

// Generate Excel report for department statistics
exports.generateDepartmentStatsExcel = async (req, res) => {
  try {
    // Check if user has permission
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to generate reports' });
    }

    const departmentId = req.params.departmentId;
    if (!departmentId) {
      return res.status(400).send({ message: 'Department ID is required' });
    }

    // Get department info
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).send({ message: 'Department not found' });
    }

    // Get all questions for the department
    const questions = await Question.findAll({
      where: { departmentId: departmentId },
      include: [{
        model: Feedback,
        as: 'feedbacks'
      }]
    });

    // Calculate statistics
    let totalResponses = 0;
    let totalRating = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const questionStats = [];

    questions.forEach(question => {
      const questionResponses = question.feedbacks.length;
      let questionTotalRating = 0;
      
      question.feedbacks.forEach(feedback => {
        totalRating += feedback.rating;
        questionTotalRating += feedback.rating;
        ratingDistribution[feedback.rating]++;
      });

      totalResponses += questionResponses;
      
      questionStats.push({
        questionId: question.id,
        questionText: question.text,
        responses: questionResponses,
        averageRating: questionResponses > 0 ? (questionTotalRating / questionResponses).toFixed(2) : 0
      });
    });

    const averageRating = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 0;

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Department Statistics');

    // Add department info
    worksheet.addRow(['Department Statistics']);
    worksheet.addRow([]);
    worksheet.addRow(['Department ID', departmentId]);
    worksheet.addRow(['Department Name', department.name]);
    worksheet.addRow(['Total Responses', totalResponses]);
    worksheet.addRow(['Average Rating', averageRating]);
    worksheet.addRow([]);

    // Add rating distribution
    worksheet.addRow(['Rating Distribution']);
    worksheet.addRow(['Rating', 'Count']);
    for (let i = 5; i >= 1; i--) {
      worksheet.addRow([i, ratingDistribution[i] || 0]);
    }
    worksheet.addRow([]);

    // Add question statistics
    worksheet.addRow(['Question Statistics']);
    worksheet.addRow(['Question ID', 'Question Text', 'Responses', 'Average Rating']);
    
    questionStats.forEach(q => {
      worksheet.addRow([
        q.questionId,
        q.questionText,
        q.responses,
        q.averageRating
      ]);
    });

    // Style headers
    [1, 8, 14].forEach(rowIndex => {
      worksheet.getRow(rowIndex).font = { bold: true };
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=department_${departmentId}_feedback_stats.xlsx`);

    // Send the workbook as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating department stats Excel report:', error);
    res.status(500).send({ message: error.message });
  }
};

// Generate Excel report for overall statistics
exports.generateOverallStatsExcel = async (req, res) => {
  try {
    // Check if user has academic or executive director role
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to generate reports' });
    }

    // Get all departments
    const departments = await Department.findAll({
      where: { active: true }
    });

    const departmentStats = [];
    let totalResponses = 0;
    let totalRating = 0;
    const overallRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Calculate statistics for each department
    for (const department of departments) {
      // Get all questions for the department
      const questions = await Question.findAll({
        where: { departmentId: department.id },
        include: [{
          model: Feedback,
          as: 'feedbacks'
        }]
      });

      let departmentResponses = 0;
      let departmentTotalRating = 0;
      const departmentRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      questions.forEach(question => {
        question.feedbacks.forEach(feedback => {
          departmentTotalRating += feedback.rating;
          departmentRatingDistribution[feedback.rating]++;
          overallRatingDistribution[feedback.rating]++;
          departmentResponses++;
        });
      });

      totalResponses += departmentResponses;
      totalRating += departmentTotalRating;

      departmentStats.push({
        departmentId: department.id,
        departmentName: department.name,
        responses: departmentResponses,
        averageRating: departmentResponses > 0 ? (departmentTotalRating / departmentResponses).toFixed(2) : 0,
        ratingDistribution: departmentRatingDistribution
      });
    }

    const overallAverageRating = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 0;

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Overall Statistics');

    // Add overall statistics
    worksheet.addRow(['Overall Statistics']);
    worksheet.addRow([]);
    worksheet.addRow(['Total Responses', totalResponses]);
    worksheet.addRow(['Overall Average Rating', overallAverageRating]);
    worksheet.addRow([]);

    // Add rating distribution
    worksheet.addRow(['Rating Distribution']);
    worksheet.addRow(['Rating', 'Count']);
    for (let i = 5; i >= 1; i--) {
      worksheet.addRow([i, overallRatingDistribution[i] || 0]);
    }
    worksheet.addRow([]);

    // Add department statistics
    worksheet.addRow(['Department Statistics']);
    worksheet.addRow(['Department ID', 'Department Name', 'Responses', 'Average Rating', '5★', '4★', '3★', '2★', '1★']);
    
    departmentStats.forEach(dept => {
      worksheet.addRow([
        dept.departmentId,
        dept.departmentName,
        dept.responses,
        dept.averageRating,
        dept.ratingDistribution['5'] || 0,
        dept.ratingDistribution['4'] || 0,
        dept.ratingDistribution['3'] || 0,
        dept.ratingDistribution['2'] || 0,
        dept.ratingDistribution['1'] || 0
      ]);
    });
    
    // Add question analysis section
    worksheet.addRow([]);
    worksheet.addRow(['Question Analysis']);
    worksheet.addRow(['Question ID', 'Question Text', 'Department', 'Responses', 'Average Rating']);
    
    // Query to get all questions with feedback data
    const questions = await Question.findAll({
      include: [{
        model: Feedback,
        as: 'feedbacks'
      }, {
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }]
    });
    
    // Process questions to calculate ratings
    const questionStats = {};
    
    for (const question of questions) {
      if (!question.feedbacks || question.feedbacks.length === 0) continue;
      
      const questionId = question.id;
      
      // Initialize question stats if not already present
      if (!questionStats[questionId]) {
        questionStats[questionId] = {
          id: questionId,
          text: question.text || 'Unknown Question',
          departmentId: question.departmentId,
          departmentName: question.department ? question.department.name : 'Unknown Department',
          responses: 0,
          totalRating: 0,
          averageRating: 0
        };
      }
      
      // Process feedback for this question
      for (const feedback of question.feedbacks) {
        questionStats[questionId].responses++;
        questionStats[questionId].totalRating += feedback.rating;
      }
    }
    
    // Calculate averages and add to worksheet
    Object.values(questionStats).forEach(question => {
      if (question.responses > 0) {
        question.averageRating = (question.totalRating / question.responses).toFixed(2);
      }
      
      worksheet.addRow([
        question.id,
        question.text,
        question.departmentName,
        question.responses,
        question.averageRating
      ]);
    });

    // Style headers
    [1, 6, 13, 20].forEach(rowIndex => {
      worksheet.getRow(rowIndex).font = { bold: true };
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=overall_feedback_stats.xlsx');

    // Send the workbook as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating overall stats Excel report:', error);
    res.status(500).send({ message: error.message });
  }
};

// Generate individual report for specific role type
exports.generateIndividualReportExcel = async (req, res) => {
  try {
    // Check if user has permission
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to generate reports' });
    }

    const roleType = req.params.roleType;
    if (!roleType) {
      return res.status(400).send({ message: 'Role type is required' });
    }

    // Define roleId based on roleType
    let roleId = null;
    let roleName = '';
    
    switch (roleType) {
      case 'student':
        roleId = 1;
        roleName = 'Student';
        break;
      case 'hod':
        roleId = 2;
        roleName = 'HOD';
        break;
      case 'staff':
        roleId = 3;
        roleName = 'Staff';
        break;
      case 'academic_director':
        roleId = 4;
        roleName = 'Academic Director';
        break;
      case 'executive_director':
        roleId = 5;
        roleName = 'Executive Director';
        break;
      default:
        return res.status(400).send({ message: 'Invalid role type' });
    }
    
    // Get all feedback data
    const feedbackData = await Feedback.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'year', 'departmentId'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            },
            {
              model: db.role,
              as: 'roles',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'text']
        }
      ]
    });
    
    // Group feedback by department and user
    const departmentData = {};
    
    // Process each feedback entry
    feedbackData.forEach(feedback => {
      const user = feedback.user;
      // Skip if no user data
      if (!user) return;
      
      // Determine role from username pattern
      let userRoleId = null;
      
      // More comprehensive pattern matching for username role identification
      if (user.username) {
        // Check for student patterns
        if (user.username.match(/^E\d/) || user.username.startsWith('ST')) {
          userRoleId = 1; // student
        }
        // Check for staff patterns
        else if (user.username.match(/^S\d/) || 
                user.username.startsWith('SF') || 
                user.username.includes('staff') || 
                user.username.includes('Staff')) {
          userRoleId = 3; // staff
        }
      }
      
      // If roles property exists, check it for role information
      if (!userRoleId && user.roles) {
        const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
        
        // Look for staff role in user roles
        for (const role of userRoles) {
          const roleName = typeof role === 'object' ? (role.name || '') : role;
          const roleId = typeof role === 'object' ? (role.id || 0) : 0;
          
          if (roleName.toLowerCase() === 'staff' || roleId === 3) {
            userRoleId = 3;
            break;
          } else if (roleName.toLowerCase() === 'student' || roleId === 1) {
            userRoleId = 1;
            break;
          }
        }
      }
      
      // For staff reports, if no role determined but user has department, assume staff
      if (!userRoleId && roleId === 3 && user.departmentId) {
        userRoleId = 3;
      }
      
      // Skip if not the target role
      if (userRoleId !== roleId) return;
      
      const userDepartmentId = user.departmentId;
      const userDepartmentName = user.department?.name || 'Unknown Department';
      
      // Initialize department if not exists
      if (!departmentData[userDepartmentId]) {
        departmentData[userDepartmentId] = {
          name: userDepartmentName,
          users: {}
        };
      }
      
      // Initialize user if not exists
      const userId = user.id;
      if (!departmentData[userDepartmentId].users[userId]) {
        departmentData[userDepartmentId].users[userId] = {
          id: userId,
          name: user.fullName || user.username || 'Anonymous',
          year: user.year,
          feedback: []
        };
      }
      
      // Add feedback to user
      departmentData[userDepartmentId].users[userId].feedback.push({
        id: feedback.id,
        questionId: feedback.questionId,
        questionText: feedback.question?.text || 'Unknown Question',
        rating: feedback.rating,
        notes: feedback.notes,
        submittedAt: feedback.submittedAt
      });
    });
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${roleName} Individual Report`);
    
    // Start row counter
    let currentRow = 1;
    
    // Add report title with role prominently displayed
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `${roleName} Individual Feedback Report`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 16 };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    currentRow += 2;
    
    // Add meeting info
    worksheet.getCell(`A${currentRow}`).value = 'MEETING INFORMATION';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, underline: true };
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Meeting ID:`;
    worksheet.getCell(`B${currentRow}`).value = meetingId;
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Meeting Title:`;
    worksheet.getCell(`B${currentRow}`).value = meeting.title;
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Meeting Date:`;
    worksheet.getCell(`B${currentRow}`).value = new Date(meeting.meetingDate).toLocaleDateString();
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Meeting Time:`;
    worksheet.getCell(`B${currentRow}`).value = `${meeting.startTime} - ${meeting.endTime}`;
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Respondent Role:`;
    worksheet.getCell(`B${currentRow}`).value = roleName;
    worksheet.getCell(`B${currentRow}`).font = { bold: true, color: { argb: '0000FF' } };
    currentRow += 2;
    
    // For each department
    Object.entries(departmentData).forEach(([deptId, dept]) => {
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = `Department: ${dept.name}`;
      worksheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DCE6F1' }
      };
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      currentRow += 2;
      
      // For each user in the department
      Object.values(dept.users).forEach(user => {
        // Create user section header with role information
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = `${roleName} Feedback: ${user.name}`;
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`A${currentRow}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E6E6E6' }
        };
        currentRow++;
        
        if (roleType === 'student' && user.year) {
          worksheet.getCell(`A${currentRow}`).value = `Year:`;
          worksheet.getCell(`B${currentRow}`).value = user.year;
          currentRow++;
        }
        
        worksheet.getCell(`A${currentRow}`).value = `User ID:`;
        worksheet.getCell(`B${currentRow}`).value = user.id;
        currentRow++;
        
        worksheet.getCell(`A${currentRow}`).value = `Role:`;
        worksheet.getCell(`B${currentRow}`).value = roleName;
        worksheet.getCell(`B${currentRow}`).font = { color: { argb: '0000FF' } };
        currentRow += 2;
        
        // Add feedback headers
        const headers = ['Question ID', 'Question', 'Rating', 'Notes', 'Submitted Date'];
        for (let i = 0; i < headers.length; i++) {
          worksheet.getCell(`${String.fromCharCode(65 + i)}${currentRow}`).value = headers[i];
          worksheet.getCell(`${String.fromCharCode(65 + i)}${currentRow}`).font = { bold: true };
          worksheet.getCell(`${String.fromCharCode(65 + i)}${currentRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F2F2' }
          };
        }
        currentRow++;
        
        // Add feedback rows
        user.feedback.forEach(item => {
          worksheet.getCell(`A${currentRow}`).value = item.questionId;
          worksheet.getCell(`B${currentRow}`).value = item.questionText;
          worksheet.getCell(`C${currentRow}`).value = item.rating;
          worksheet.getCell(`D${currentRow}`).value = item.notes || '';
          worksheet.getCell(`E${currentRow}`).value = new Date(item.submittedAt).toLocaleString();
          currentRow++;
        });
        
        // Calculate average rating for this user
        const totalRating = user.feedback.reduce((sum, item) => sum + item.rating, 0);
        const averageRating = user.feedback.length > 0 ? (totalRating / user.feedback.length).toFixed(2) : 'N/A';
        
        currentRow++;
        worksheet.getCell(`A${currentRow}`).value = `Average Rating:`;
        worksheet.getCell(`B${currentRow}`).value = averageRating;
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`B${currentRow}`).font = { bold: true };
        currentRow += 2;
        
        // Add separator between users
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = '-------------------------';
        worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
        currentRow += 2;
      });
      
      // Add separator between departments
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = '=========================';
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      currentRow += 2;
    });
    
    // Add summary section
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `SUMMARY: ${roleName} Feedback for ${meeting.title}`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    worksheet.getCell(`A${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DCE6F1' }
    };
    currentRow += 2;
    
    // Count total responses
    let totalResponses = 0;
    let totalRating = 0;
    
    Object.values(departmentData).forEach(dept => {
      Object.values(dept.users).forEach(user => {
        totalResponses += user.feedback.length;
        totalRating += user.feedback.reduce((sum, item) => sum + item.rating, 0);
      });
    });
    
    const overallAverage = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 'N/A';
    
    worksheet.getCell(`A${currentRow}`).value = `Total ${roleName} Respondents:`;
    worksheet.getCell(`B${currentRow}`).value = Object.values(departmentData).reduce((count, dept) => count + Object.keys(dept.users).length, 0);
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Total Feedback Responses:`;
    worksheet.getCell(`B${currentRow}`).value = totalResponses;
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Overall Average Rating:`;
    worksheet.getCell(`B${currentRow}`).value = overallAverage;
    currentRow++;
    
    // Add question analysis section
    currentRow += 2;
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'QUESTION ANALYSIS';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, underline: true };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    worksheet.getCell(`A${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F2F2' }
    };
    currentRow += 2;
    
    // Add headers for question analysis
    worksheet.getCell(`A${currentRow}`).value = 'Question ID';
    worksheet.getCell(`B${currentRow}`).value = 'Question Text';
    worksheet.getCell(`C${currentRow}`).value = 'Responses';
    worksheet.getCell(`D${currentRow}`).value = 'Average Rating';
    
    // Style headers
    for (let i = 0; i < 4; i++) {
      worksheet.getCell(`${String.fromCharCode(65 + i)}${currentRow}`).font = { bold: true };
      worksheet.getCell(`${String.fromCharCode(65 + i)}${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F2F2F2' }
      };
    }
    currentRow++;
    
    // Process feedback data to get question stats for this role
    const questionStats = {};
    
    Object.values(departmentData).forEach(dept => {
      Object.values(dept.users).forEach(user => {
        user.feedback.forEach(feedback => {
          const questionId = feedback.questionId;
          
          // Skip if no question ID
          if (!questionId) return;
          
          // Initialize question stats if not exists
          if (!questionStats[questionId]) {
            questionStats[questionId] = {
              id: questionId,
              text: feedback.questionText || 'Unknown Question',
              responses: 0,
              totalRating: 0
            };
          }
          
          // Update stats
          questionStats[questionId].responses++;
          questionStats[questionId].totalRating += feedback.rating;
        });
      });
    });
    
    // Calculate averages and add to worksheet
    Object.values(questionStats).forEach(question => {
      const averageRating = question.responses > 0 
        ? (question.totalRating / question.responses).toFixed(2) 
        : 'N/A';
      
      worksheet.getCell(`A${currentRow}`).value = question.id;
      worksheet.getCell(`B${currentRow}`).value = question.text;
      worksheet.getCell(`C${currentRow}`).value = question.responses;
      worksheet.getCell(`D${currentRow}`).value = averageRating;
      currentRow++;
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 25;
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meetingId}_${roleName.toLowerCase()}_individual_report.xlsx`);
    
    // Send the workbook as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating meeting individual report Excel:', error);
    res.status(500).send({ message: error.message });
  }
};

// Generate Excel report for meeting feedback
exports.generateMeetingFeedbackExcel = async (req, res) => {
  try {
    // Check if user has permission (academic director or executive director)
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to generate reports' });
    }

    const meetingId = req.params.meetingId;
    
    if (!meetingId) {
      return res.status(400).send({ message: 'Meeting ID is required' });
    }
    
    // Check if meeting exists
    const meeting = await db.meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }
    
    // Get feedback for this meeting
    const feedback = await Feedback.findAll({
      where: { meetingId: meetingId },
      include: [
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'text', 'year'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'year', 'departmentId'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        }
      ]
    });

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Meeting Feedback');

    // Add meeting info
    worksheet.addRow(['Meeting Feedback Report']);
    worksheet.addRow([]);
    worksheet.addRow(['Meeting ID', meetingId]);
    worksheet.addRow(['Meeting Title', meeting.title]);
    worksheet.addRow(['Meeting Date', new Date(meeting.meetingDate).toLocaleDateString()]);
    worksheet.addRow(['Meeting Time', `${meeting.startTime} - ${meeting.endTime}`]);
    worksheet.addRow([]);

    // Add headers for feedback data
    worksheet.addRow([
      'ID', 
      'Rating', 
      'User',
      'User Department', 
      'Question', 
      'Question Department',
      'Submitted Date', 
      'Notes'
    ]);

    // Add data
    feedback.forEach(item => {
      worksheet.addRow([
        item.id || '',
        item.rating || '',
        item.user?.fullName || item.user?.username || 'Anonymous',
        item.user?.department?.name || 'Unknown',
        item.question?.text || 'Unknown',
        item.question?.department?.name || 'Unknown',
        item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '',
        item.notes || ''
      ]);
    });

    // Add feedback statistics
    const totalResponses = feedback.length;
    let totalRating = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    feedback.forEach(item => {
      totalRating += item.rating;
      ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + 1;
    });

    const averageRating = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 0;

    // Add statistics to worksheet
    worksheet.addRow([]);
    worksheet.addRow(['Feedback Statistics']);
    worksheet.addRow(['Total Responses', totalResponses]);
    worksheet.addRow(['Average Rating', averageRating]);
    worksheet.addRow([]);

    // Add rating distribution
    worksheet.addRow(['Rating Distribution']);
    worksheet.addRow(['Rating', 'Count']);
    for (let i = 5; i >= 1; i--) {
      worksheet.addRow([i, ratingDistribution[i] || 0]);
    }

    // Style the headers
    [1, 8, 17, 20].forEach(rowIndex => {
      if (worksheet.getRow(rowIndex).values.length > 0) {
        worksheet.getRow(rowIndex).font = { bold: true };
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meetingId}_feedback.xlsx`);

    // Send the workbook as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating meeting feedback Excel report:', error);
    res.status(500).send({ message: error.message });
  }
};

// Generate Excel report for all feedback from a specific meeting
exports.generateMeetingAllFeedbackExcel = async (req, res) => {
  try {
    // Check if user has permission to view feedback (academic director or executive director)
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to generate reports' });
    }

    const meetingId = req.params.meetingId;
    
    if (!meetingId) {
      return res.status(400).send({ message: 'Meeting ID is required' });
    }
    
    // Check if meeting exists
    const meeting = await db.meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }

    // Get all feedback for this meeting
    const feedback = await Feedback.findAll({
      where: { meetingId: meetingId },
      order: [['submittedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'year', 'departmentId'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            },
            {
              model: db.role,
              as: 'roles',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'text', 'year', 'departmentId'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        }
      ]
    });

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Meeting Feedback');

    // Add meeting info
    worksheet.addRow(['Meeting Feedback Report - All Feedback']);
    worksheet.addRow([]);
    worksheet.addRow(['Meeting ID', meetingId]);
    worksheet.addRow(['Meeting Title', meeting.title]);
    worksheet.addRow(['Meeting Date', new Date(meeting.meetingDate).toLocaleDateString()]);
    worksheet.addRow(['Meeting Time', `${meeting.startTime} - ${meeting.endTime}`]);
    worksheet.addRow([]);

    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'User', key: 'user', width: 25 },
      { header: 'User Role', key: 'userRole', width: 15 },
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Question', key: 'question', width: 50 },
      { header: 'Submitted Date', key: 'submittedAt', width: 20 },
      { header: 'Notes', key: 'notes', width: 50 }
    ];

    // Add data
    feedback.forEach(item => {
      // Determine user's role
      let userRole = 'Unknown';
      const user = item.user;
      
      if (user) {
        // Try to determine role from roles array
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
          const roleName = user.roles[0].name;
          if (roleName) {
            userRole = roleName.charAt(0).toUpperCase() + roleName.slice(1);
          }
        }
        
        // If no role found, try to determine from username pattern
        if (userRole === 'Unknown' && user.username) {
          if (user.username.match(/^E\d/) || user.username.startsWith('ST')) {
            userRole = 'Student';
          } else if (user.username.match(/^S\d/) || 
                    user.username.startsWith('SF') || 
                    user.username.includes('staff') || 
                    user.username.includes('Staff')) {
            userRole = 'Staff';
          }
        }
      }
      
      worksheet.addRow({
        id: item.id || '',
        rating: item.rating || '',
        user: item.user?.fullName || item.user?.username || 'Anonymous',
        userRole: userRole,
        department: item.user?.department?.name || 'Unknown',
        question: item.question?.text || 'Unknown',
        submittedAt: item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '',
        notes: item.notes || ''
      });
    });

    // Add question analysis section
    worksheet.addRow([]);
    worksheet.addRow(['Question Analysis Section']);
    worksheet.addRow([]);
    worksheet.addRow(['Question ID', 'Question Text', 'Department', 'Total Responses', 'Average Rating']);
    
    // Process feedback data to calculate question stats
    const questionStats = {};
    
    feedback.forEach(item => {
      if (!item.question || !item.question.id) return;
      
      const questionId = item.question.id;
      
      // Initialize question stats object if it doesn't exist
      if (!questionStats[questionId]) {
        questionStats[questionId] = {
          id: questionId,
          text: item.question.text || 'Unknown Question',
          department: item.question?.department?.name || 'Unknown',
          responses: 0,
          totalRating: 0,
        };
      }
      
      // Update question stats
      questionStats[questionId].responses += 1;
      questionStats[questionId].totalRating += item.rating;
    });
    
    // Add question stats to worksheet
    Object.values(questionStats).forEach(question => {
      const averageRating = question.responses > 0 
        ? (question.totalRating / question.responses).toFixed(2) 
        : 'N/A';
      
      worksheet.addRow([
        question.id,
        question.text,
        question.department,
        question.responses,
        averageRating
      ]);
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(8).font = { bold: true };
    worksheet.getRow(worksheet.rowCount - Object.keys(questionStats).length - 2).font = { bold: true };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meetingId}_all_feedback.xlsx`);

    // Send the workbook as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).send({ message: error.message });
  }
};

// Generate Excel report for department statistics for a specific meeting
exports.generateMeetingDepartmentStatsExcel = async (req, res) => {
  try {
    // Check if user has permission
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to generate reports' });
    }

    const meetingId = req.params.meetingId;
    const departmentId = req.params.departmentId;
    
    if (!meetingId) {
      return res.status(400).send({ message: 'Meeting ID is required' });
    }
    
    if (!departmentId) {
      return res.status(400).send({ message: 'Department ID is required' });
    }

    // Check if meeting exists
    const meeting = await db.meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }

    // Get department info
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).send({ message: 'Department not found' });
    }

    // Get detailed feedback data with user information
    const feedbackData = await Feedback.findAll({
      where: { meetingId: meetingId },
      include: [
        {
          model: Question,
          as: 'question',
          where: { departmentId: departmentId },
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'year', 'departmentId'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            },
            {
              model: db.role,
              as: 'roles',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    // Get all questions for the department
    const questions = await Question.findAll({
      where: { departmentId: departmentId },
      include: [{
        model: Feedback,
        as: 'feedbacks',
        where: { meetingId: meetingId },
        required: false // Use outer join to include questions with no feedback
      }]
    });

    // Calculate statistics
    let totalResponses = 0;
    let totalRating = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const questionStats = [];
    
    // Role-based statistics
    const roleStats = {
      student: { count: 0, totalRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      staff: { count: 0, totalRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      other: { count: 0, totalRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
    };

    questions.forEach(question => {
      const questionResponses = question.feedbacks.length;
      let questionTotalRating = 0;
      
      question.feedbacks.forEach(feedback => {
        totalRating += feedback.rating;
        questionTotalRating += feedback.rating;
        ratingDistribution[feedback.rating]++;
      });

      totalResponses += questionResponses;
      
      questionStats.push({
        questionId: question.id,
        questionText: question.text,
        responses: questionResponses,
        averageRating: questionResponses > 0 ? (questionTotalRating / questionResponses).toFixed(2) : 0
      });
    });

    // Process role-based statistics from detailed feedback data
    feedbackData.forEach(feedback => {
      let roleCategory = 'other';
      const user = feedback.user;
      
      if (user) {
        // Try to determine role from roles array
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
          const roleName = user.roles[0].name?.toLowerCase();
          if (roleName === 'student') {
            roleCategory = 'student';
          } else if (roleName === 'staff') {
            roleCategory = 'staff';
          }
        }
        
        // If no role found, try to determine from username pattern
        if (roleCategory === 'other' && user.username) {
          if (user.username.match(/^E\d/) || user.username.startsWith('ST')) {
            roleCategory = 'student';
          } else if (user.username.match(/^S\d/) || 
                    user.username.startsWith('SF') || 
                    user.username.includes('staff') || 
                    user.username.includes('Staff')) {
            roleCategory = 'staff';
          }
        }
      }
      
      // Update role statistics
      roleStats[roleCategory].count += 1;
      roleStats[roleCategory].totalRating += feedback.rating;
      roleStats[roleCategory].ratingDistribution[feedback.rating] += 1;
    });

    const averageRating = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 0;

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Department Statistics');

    // Add meeting info
    worksheet.addRow(['Meeting Department Statistics']);
    worksheet.addRow([]);
    worksheet.addRow(['Meeting ID', meetingId]);
    worksheet.addRow(['Meeting Title', meeting.title]);
    worksheet.addRow(['Meeting Date', new Date(meeting.meetingDate).toLocaleDateString()]);
    worksheet.addRow(['Meeting Time', `${meeting.startTime} - ${meeting.endTime}`]);
    worksheet.addRow([]);

    // Add department info
    worksheet.addRow(['Department ID', departmentId]);
    worksheet.addRow(['Department Name', department.name]);
    worksheet.addRow(['Total Responses', totalResponses]);
    worksheet.addRow(['Average Rating', averageRating]);
    worksheet.addRow([]);

    // Add role-based statistics section
    worksheet.addRow(['Role-Based Statistics']);
    worksheet.addRow(['Role', 'Response Count', 'Percentage', 'Average Rating', '5★', '4★', '3★', '2★', '1★']);
    
    // Add student statistics
    const studentAvg = roleStats.student.count > 0 ? (roleStats.student.totalRating / roleStats.student.count).toFixed(2) : 'N/A';
    const studentPct = totalResponses > 0 ? ((roleStats.student.count / totalResponses) * 100).toFixed(1) + '%' : 'N/A';
    worksheet.addRow([
      'Student', 
      roleStats.student.count,
      studentPct,
      studentAvg,
      roleStats.student.ratingDistribution[5] || 0,
      roleStats.student.ratingDistribution[4] || 0,
      roleStats.student.ratingDistribution[3] || 0,
      roleStats.student.ratingDistribution[2] || 0,
      roleStats.student.ratingDistribution[1] || 0
    ]);
    
    // Add staff statistics
    const staffAvg = roleStats.staff.count > 0 ? (roleStats.staff.totalRating / roleStats.staff.count).toFixed(2) : 'N/A';
    const staffPct = totalResponses > 0 ? ((roleStats.staff.count / totalResponses) * 100).toFixed(1) + '%' : 'N/A';
    worksheet.addRow([
      'Staff', 
      roleStats.staff.count,
      staffPct,
      staffAvg,
      roleStats.staff.ratingDistribution[5] || 0,
      roleStats.staff.ratingDistribution[4] || 0,
      roleStats.staff.ratingDistribution[3] || 0,
      roleStats.staff.ratingDistribution[2] || 0,
      roleStats.staff.ratingDistribution[1] || 0
    ]);
    
    // Add other roles statistics
    const otherAvg = roleStats.other.count > 0 ? (roleStats.other.totalRating / roleStats.other.count).toFixed(2) : 'N/A';
    const otherPct = totalResponses > 0 ? ((roleStats.other.count / totalResponses) * 100).toFixed(1) + '%' : 'N/A';
    worksheet.addRow([
      'Other', 
      roleStats.other.count,
      otherPct,
      otherAvg,
      roleStats.other.ratingDistribution[5] || 0,
      roleStats.other.ratingDistribution[4] || 0,
      roleStats.other.ratingDistribution[3] || 0,
      roleStats.other.ratingDistribution[2] || 0,
      roleStats.other.ratingDistribution[1] || 0
    ]);
    worksheet.addRow([]);

    // Add rating distribution
    worksheet.addRow(['Overall Rating Distribution']);
    worksheet.addRow(['Rating', 'Count']);
    for (let i = 5; i >= 1; i--) {
      worksheet.addRow([i, ratingDistribution[i] || 0]);
    }
    worksheet.addRow([]);

    // Add question statistics
    worksheet.addRow(['Question Statistics']);
    worksheet.addRow(['Question ID', 'Question Text', 'Responses', 'Average Rating']);
    
    questionStats.forEach(q => {
      worksheet.addRow([
        q.questionId,
        q.questionText,
        q.responses,
        q.averageRating
      ]);
    });

    // Style headers
    [1, 8, 13, 14, 19, 26, 27, 33].forEach(rowIndex => {
      if (worksheet.getRow(rowIndex).values && worksheet.getRow(rowIndex).values.length > 0) {
        worksheet.getRow(rowIndex).font = { bold: true };
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meetingId}_department_${departmentId}_stats.xlsx`);

    // Send the workbook as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating meeting department stats Excel report:', error);
    res.status(500).send({ message: error.message });
  }
};

// Generate Excel report for overall statistics for a specific meeting
exports.generateMeetingOverallStatsExcel = async (req, res) => {
  try {
    // Check if user has academic or executive director role
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to generate reports' });
    }

    const meetingId = req.params.meetingId;
    
    if (!meetingId) {
      return res.status(400).send({ message: 'Meeting ID is required' });
    }

    // Check if meeting exists
    const meeting = await db.meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }

    // Get detailed feedback data with user information
    const allFeedbackData = await Feedback.findAll({
      where: { meetingId: meetingId },
      include: [
        {
          model: Question,
          as: 'question',
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'year', 'departmentId'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            },
            {
              model: db.role,
              as: 'roles',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    // Get all departments
    const departments = await Department.findAll({
      where: { active: true }
    });

    const departmentStats = [];
    let totalResponses = 0;
    let totalRating = 0;
    const overallRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    // Role-based statistics
    const roleStats = {
      student: { count: 0, totalRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      staff: { count: 0, totalRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      other: { count: 0, totalRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
    };

    // Calculate statistics for each department
    for (const department of departments) {
      // Get all questions for the department
      const questions = await Question.findAll({
        where: { departmentId: department.id },
        include: [{
          model: Feedback,
          as: 'feedbacks',
          where: { meetingId: meetingId },
          required: false // Use outer join to include questions with no feedback
        }]
      });

      let departmentResponses = 0;
      let departmentTotalRating = 0;
      const departmentRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      questions.forEach(question => {
        question.feedbacks.forEach(feedback => {
          departmentTotalRating += feedback.rating;
          departmentRatingDistribution[feedback.rating]++;
          overallRatingDistribution[feedback.rating]++;
          departmentResponses++;
        });
      });

      totalResponses += departmentResponses;
      totalRating += departmentTotalRating;

      departmentStats.push({
        departmentId: department.id,
        departmentName: department.name,
        responses: departmentResponses,
        averageRating: departmentResponses > 0 ? (departmentTotalRating / departmentResponses).toFixed(2) : 0,
        ratingDistribution: departmentRatingDistribution
      });
    }

    // Process role-based statistics from detailed feedback data
    allFeedbackData.forEach(feedback => {
      let roleCategory = 'other';
      const user = feedback.user;
      
      if (user) {
        // Try to determine role from roles array
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
          const roleName = user.roles[0].name?.toLowerCase();
          if (roleName === 'student') {
            roleCategory = 'student';
          } else if (roleName === 'staff') {
            roleCategory = 'staff';
          }
        }
        
        // If no role found, try to determine from username pattern
        if (roleCategory === 'other' && user.username) {
          if (user.username.match(/^E\d/) || user.username.startsWith('ST')) {
            roleCategory = 'student';
          } else if (user.username.match(/^S\d/) || 
                    user.username.startsWith('SF') || 
                    user.username.includes('staff') || 
                    user.username.includes('Staff')) {
            roleCategory = 'staff';
          }
        }
      }
      
      // Update role statistics
      roleStats[roleCategory].count += 1;
      roleStats[roleCategory].totalRating += feedback.rating;
      roleStats[roleCategory].ratingDistribution[feedback.rating] += 1;
    });

    const overallAverageRating = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 0;

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Meeting Overall Statistics');

    // Add meeting info
    worksheet.addRow(['Meeting Overall Statistics']);
    worksheet.addRow([]);
    worksheet.addRow(['Meeting ID', meetingId]);
    worksheet.addRow(['Meeting Title', meeting.title]);
    worksheet.addRow(['Meeting Date', new Date(meeting.meetingDate).toLocaleDateString()]);
    worksheet.addRow(['Meeting Time', `${meeting.startTime} - ${meeting.endTime}`]);
    worksheet.addRow([]);

    // Add overall statistics
    worksheet.addRow(['Total Responses', totalResponses]);
    worksheet.addRow(['Overall Average Rating', overallAverageRating]);
    worksheet.addRow([]);

    // Add role-based statistics section
    worksheet.addRow(['Role-Based Statistics']);
    worksheet.addRow(['Role', 'Response Count', 'Percentage', 'Average Rating', '5★', '4★', '3★', '2★', '1★']);
    
    // Add student statistics
    const studentAvg = roleStats.student.count > 0 ? (roleStats.student.totalRating / roleStats.student.count).toFixed(2) : 'N/A';
    const studentPct = totalResponses > 0 ? ((roleStats.student.count / totalResponses) * 100).toFixed(1) + '%' : 'N/A';
    worksheet.addRow([
      'Student', 
      roleStats.student.count,
      studentPct,
      studentAvg,
      roleStats.student.ratingDistribution[5] || 0,
      roleStats.student.ratingDistribution[4] || 0,
      roleStats.student.ratingDistribution[3] || 0,
      roleStats.student.ratingDistribution[2] || 0,
      roleStats.student.ratingDistribution[1] || 0
    ]);
    
    // Add staff statistics
    const staffAvg = roleStats.staff.count > 0 ? (roleStats.staff.totalRating / roleStats.staff.count).toFixed(2) : 'N/A';
    const staffPct = totalResponses > 0 ? ((roleStats.staff.count / totalResponses) * 100).toFixed(1) + '%' : 'N/A';
    worksheet.addRow([
      'Staff', 
      roleStats.staff.count,
      staffPct,
      staffAvg,
      roleStats.staff.ratingDistribution[5] || 0,
      roleStats.staff.ratingDistribution[4] || 0,
      roleStats.staff.ratingDistribution[3] || 0,
      roleStats.staff.ratingDistribution[2] || 0,
      roleStats.staff.ratingDistribution[1] || 0
    ]);
    
    // Add other roles statistics
    const otherAvg = roleStats.other.count > 0 ? (roleStats.other.totalRating / roleStats.other.count).toFixed(2) : 'N/A';
    const otherPct = totalResponses > 0 ? ((roleStats.other.count / totalResponses) * 100).toFixed(1) + '%' : 'N/A';
    worksheet.addRow([
      'Other', 
      roleStats.other.count,
      otherPct,
      otherAvg,
      roleStats.other.ratingDistribution[5] || 0,
      roleStats.other.ratingDistribution[4] || 0,
      roleStats.other.ratingDistribution[3] || 0,
      roleStats.other.ratingDistribution[2] || 0,
      roleStats.other.ratingDistribution[1] || 0
    ]);
    worksheet.addRow([]);

    // Add rating distribution
    worksheet.addRow(['Rating Distribution']);
    worksheet.addRow(['Rating', 'Count']);
    for (let i = 5; i >= 1; i--) {
      worksheet.addRow([i, overallRatingDistribution[i] || 0]);
    }
    worksheet.addRow([]);

    // Add department statistics
    worksheet.addRow(['Department Statistics']);
    worksheet.addRow(['Department ID', 'Department Name', 'Responses', 'Average Rating', '5★', '4★', '3★', '2★', '1★']);
    
    departmentStats.forEach(dept => {
      worksheet.addRow([
        dept.departmentId,
        dept.departmentName,
        dept.responses,
        dept.averageRating,
        dept.ratingDistribution['5'] || 0,
        dept.ratingDistribution['4'] || 0,
        dept.ratingDistribution['3'] || 0,
        dept.ratingDistribution['2'] || 0,
        dept.ratingDistribution['1'] || 0
      ]);
    });
    
    // Add question analysis section
    worksheet.addRow([]);
    worksheet.addRow(['Question Analysis']);
    worksheet.addRow(['Question ID', 'Question Text', 'Department', 'Responses', 'Average Rating']);
    
    // Get questions with ratings for this meeting
    const questionsData = await Feedback.findAll({
      where: { meetingId: meetingId },
      include: [
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'text', 'departmentId'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        }
      ]
    });
    
    // Group feedback by question ID
    const questionStats = {};
    
    // Process each feedback entry
    for (const feedback of questionsData) {
      if (!feedback || !feedback.question || !feedback.question.id) continue;
      
      const questionId = feedback.question.id;
      
      // Initialize question in map if not already present
      if (!questionStats[questionId]) {
        questionStats[questionId] = {
          id: questionId,
          text: feedback.question.text || 'Unknown Question',
          departmentId: feedback.question.departmentId,
          departmentName: feedback.question.department ? feedback.question.department.name : 'Unknown Department',
          responses: 0,
          totalRating: 0
        };
      }
      
      // Update totals
      questionStats[questionId].responses++;
      questionStats[questionId].totalRating += feedback.rating;
    }
    
    // Calculate averages and add to worksheet
    Object.values(questionStats).forEach(question => {
      if (question.responses > 0) {
        question.averageRating = (question.totalRating / question.responses).toFixed(2);
      }
      
      worksheet.addRow([
        question.id,
        question.text,
        question.departmentName,
        question.responses,
        question.averageRating || 'N/A'
      ]);
    });

    // Style headers
    [1, 8, 11, 12, 17, 18, 24, 25, 31, 32].forEach(rowIndex => {
      if (worksheet.getRow(rowIndex).values && worksheet.getRow(rowIndex).values.length > 0) {
        worksheet.getRow(rowIndex).font = { bold: true };
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meetingId}_overall_stats.xlsx`);

    // Send the workbook as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating meeting overall stats Excel report:', error);
    res.status(500).send({ message: error.message });
  }
};

// Add missing function for generateMeetingIndividualReportExcel
exports.generateMeetingIndividualReportExcel = async (req, res) => {
  try {
    // Check if user has permission
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to generate reports' });
    }

    const meetingId = req.params.meetingId;
    const roleType = req.params.roleType;
    
    if (!meetingId) {
      return res.status(400).send({ message: 'Meeting ID is required' });
    }
    
    if (!roleType) {
      return res.status(400).send({ message: 'Role type is required' });
    }

    // Check if meeting exists
    const meeting = await db.meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).send({ message: 'Meeting not found' });
    }

    // Define roleId based on roleType
    let roleId = null;
    let roleName = '';
    
    switch (roleType) {
      case 'student':
        roleId = 1;
        roleName = 'Student';
        break;
      case 'hod':
        roleId = 2;
        roleName = 'HOD';
        break;
      case 'staff':
        roleId = 3;
        roleName = 'Staff';
        break;
      case 'academic_director':
        roleId = 4;
        roleName = 'Academic Director';
        break;
      case 'executive_director':
        roleId = 5;
        roleName = 'Executive Director';
        break;
      default:
        return res.status(400).send({ message: 'Invalid role type' });
    }
    
    // Get feedback for this meeting
    const feedbackData = await Feedback.findAll({
      where: { meetingId: meetingId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'year', 'departmentId'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            },
            {
              model: db.role,
              as: 'roles',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'text']
        }
      ]
    });
    
    // Group feedback by department and user
    const departmentData = {};
    
    // Process each feedback entry
    feedbackData.forEach(feedback => {
      const user = feedback.user;
      // Skip if no user data
      if (!user) return;
      
      // Determine role from username pattern
      let userRoleId = null;
      
      // More comprehensive pattern matching for username role identification
      if (user.username) {
        // Check for student patterns
        if (user.username.match(/^E\d/) || user.username.startsWith('ST')) {
          userRoleId = 1; // student
        }
        // Check for staff patterns
        else if (user.username.match(/^S\d/) || 
                user.username.startsWith('SF') || 
                user.username.includes('staff') || 
                user.username.includes('Staff')) {
          userRoleId = 3; // staff
        }
      }
      
      // If roles property exists, check it for role information
      if (!userRoleId && user.roles) {
        const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
        
        // Look for staff role in user roles
        for (const role of userRoles) {
          const roleName = typeof role === 'object' ? (role.name || '') : role;
          const roleId = typeof role === 'object' ? (role.id || 0) : 0;
          
          if (roleName.toLowerCase() === 'staff' || roleId === 3) {
            userRoleId = 3;
            break;
          } else if (roleName.toLowerCase() === 'student' || roleId === 1) {
            userRoleId = 1;
            break;
          }
        }
      }
      
      // For staff reports, if no role determined but user has department, assume staff
      if (!userRoleId && roleId === 3 && user.departmentId) {
        userRoleId = 3;
      }
      
      // Skip if not the target role
      if (userRoleId !== roleId) return;
      
      const userDepartmentId = user.departmentId;
      const userDepartmentName = user.department?.name || 'Unknown Department';
      
      // Initialize department if not exists
      if (!departmentData[userDepartmentId]) {
        departmentData[userDepartmentId] = {
          name: userDepartmentName,
          users: {}
        };
      }
      
      // Initialize user if not exists
      const userId = user.id;
      if (!departmentData[userDepartmentId].users[userId]) {
        departmentData[userDepartmentId].users[userId] = {
          id: userId,
          name: user.fullName || user.username || 'Anonymous',
          year: user.year,
          feedback: []
        };
      }
      
      // Add feedback to user
      departmentData[userDepartmentId].users[userId].feedback.push({
        id: feedback.id,
        questionId: feedback.questionId,
        questionText: feedback.question?.text || 'Unknown Question',
        rating: feedback.rating,
        notes: feedback.notes,
        submittedAt: feedback.submittedAt
      });
    });
    
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${roleName} Report`);
    
    // Start row counter
    let currentRow = 1;
    
    // Add report title with role prominently displayed
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `${roleName} Individual Feedback Report`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 16 };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    currentRow += 2;
    
    // Add meeting info
    worksheet.getCell(`A${currentRow}`).value = 'MEETING INFORMATION';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, underline: true };
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Meeting ID:`;
    worksheet.getCell(`B${currentRow}`).value = meetingId;
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Meeting Title:`;
    worksheet.getCell(`B${currentRow}`).value = meeting.title;
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Meeting Date:`;
    worksheet.getCell(`B${currentRow}`).value = new Date(meeting.meetingDate).toLocaleDateString();
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Meeting Time:`;
    worksheet.getCell(`B${currentRow}`).value = `${meeting.startTime} - ${meeting.endTime}`;
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Respondent Role:`;
    worksheet.getCell(`B${currentRow}`).value = roleName;
    worksheet.getCell(`B${currentRow}`).font = { bold: true, color: { argb: '0000FF' } };
    currentRow += 2;
    
    // For each department
    Object.entries(departmentData).forEach(([deptId, dept]) => {
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = `Department: ${dept.name}`;
      worksheet.getCell(`A${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DCE6F1' }
      };
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      currentRow += 2;
      
      // For each user in the department
      Object.values(dept.users).forEach(user => {
        // Create user section header with role information
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = `${roleName} Feedback: ${user.name}`;
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`A${currentRow}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E6E6E6' }
        };
        currentRow++;
        
        if (roleType === 'student' && user.year) {
          worksheet.getCell(`A${currentRow}`).value = `Year:`;
          worksheet.getCell(`B${currentRow}`).value = user.year;
          currentRow++;
        }
        
        worksheet.getCell(`A${currentRow}`).value = `User ID:`;
        worksheet.getCell(`B${currentRow}`).value = user.id;
        currentRow++;
        
        worksheet.getCell(`A${currentRow}`).value = `Role:`;
        worksheet.getCell(`B${currentRow}`).value = roleName;
        worksheet.getCell(`B${currentRow}`).font = { color: { argb: '0000FF' } };
        currentRow += 2;
        
        // Add feedback headers
        const headers = ['Question ID', 'Question', 'Rating', 'Notes', 'Submitted Date'];
        for (let i = 0; i < headers.length; i++) {
          worksheet.getCell(`${String.fromCharCode(65 + i)}${currentRow}`).value = headers[i];
          worksheet.getCell(`${String.fromCharCode(65 + i)}${currentRow}`).font = { bold: true };
          worksheet.getCell(`${String.fromCharCode(65 + i)}${currentRow}`).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F2F2' }
          };
        }
        currentRow++;
        
        // Add feedback rows
        user.feedback.forEach(item => {
          worksheet.getCell(`A${currentRow}`).value = item.questionId;
          worksheet.getCell(`B${currentRow}`).value = item.questionText;
          worksheet.getCell(`C${currentRow}`).value = item.rating;
          worksheet.getCell(`D${currentRow}`).value = item.notes || '';
          worksheet.getCell(`E${currentRow}`).value = new Date(item.submittedAt).toLocaleString();
          currentRow++;
        });
        
        // Calculate average rating for this user
        const totalRating = user.feedback.reduce((sum, item) => sum + item.rating, 0);
        const averageRating = user.feedback.length > 0 ? (totalRating / user.feedback.length).toFixed(2) : 'N/A';
        
        currentRow++;
        worksheet.getCell(`A${currentRow}`).value = `Average Rating:`;
        worksheet.getCell(`B${currentRow}`).value = averageRating;
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`B${currentRow}`).font = { bold: true };
        currentRow += 2;
        
        // Add separator between users
        worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = '-------------------------';
        worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
        currentRow += 2;
      });
      
      // Add separator between departments
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = '=========================';
      worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
      currentRow += 2;
    });
    
    // Add summary section
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = `SUMMARY: ${roleName} Feedback for ${meeting.title}`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    worksheet.getCell(`A${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DCE6F1' }
    };
    currentRow += 2;
    
    // Count total responses
    let totalResponses = 0;
    let totalRating = 0;
    
    Object.values(departmentData).forEach(dept => {
      Object.values(dept.users).forEach(user => {
        totalResponses += user.feedback.length;
        totalRating += user.feedback.reduce((sum, item) => sum + item.rating, 0);
      });
    });
    
    const overallAverage = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 'N/A';
    
    worksheet.getCell(`A${currentRow}`).value = `Total ${roleName} Respondents:`;
    worksheet.getCell(`B${currentRow}`).value = Object.values(departmentData).reduce((count, dept) => count + Object.keys(dept.users).length, 0);
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Total Feedback Responses:`;
    worksheet.getCell(`B${currentRow}`).value = totalResponses;
    currentRow++;
    
    worksheet.getCell(`A${currentRow}`).value = `Overall Average Rating:`;
    worksheet.getCell(`B${currentRow}`).value = overallAverage;
    currentRow++;
    
    // Add question analysis section
    currentRow += 2;
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'QUESTION ANALYSIS';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, underline: true };
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: 'center' };
    worksheet.getCell(`A${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F2F2' }
    };
    currentRow += 2;
    
    // Add headers for question analysis
    worksheet.getCell(`A${currentRow}`).value = 'Question ID';
    worksheet.getCell(`B${currentRow}`).value = 'Question Text';
    worksheet.getCell(`C${currentRow}`).value = 'Responses';
    worksheet.getCell(`D${currentRow}`).value = 'Average Rating';
    
    // Style headers
    for (let i = 0; i < 4; i++) {
      worksheet.getCell(`${String.fromCharCode(65 + i)}${currentRow}`).font = { bold: true };
      worksheet.getCell(`${String.fromCharCode(65 + i)}${currentRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F2F2F2' }
      };
    }
    currentRow++;
    
    // Process feedback data to get question stats for this role
    const questionStats = {};
    
    Object.values(departmentData).forEach(dept => {
      Object.values(dept.users).forEach(user => {
        user.feedback.forEach(feedback => {
          const questionId = feedback.questionId;
          
          // Skip if no question ID
          if (!questionId) return;
          
          // Initialize question stats if not exists
          if (!questionStats[questionId]) {
            questionStats[questionId] = {
              id: questionId,
              text: feedback.questionText || 'Unknown Question',
              responses: 0,
              totalRating: 0
            };
          }
          
          // Update stats
          questionStats[questionId].responses++;
          questionStats[questionId].totalRating += feedback.rating;
        });
      });
    });
    
    // Calculate averages and add to worksheet
    Object.values(questionStats).forEach(question => {
      const averageRating = question.responses > 0 
        ? (question.totalRating / question.responses).toFixed(2) 
        : 'N/A';
      
      worksheet.getCell(`A${currentRow}`).value = question.id;
      worksheet.getCell(`B${currentRow}`).value = question.text;
      worksheet.getCell(`C${currentRow}`).value = question.responses;
      worksheet.getCell(`D${currentRow}`).value = averageRating;
      currentRow++;
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 25;
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meetingId}_${roleName.toLowerCase()}_individual_report.xlsx`);
    
    // Send the workbook as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating meeting individual report Excel:', error);
    res.status(500).send({ message: error.message });
  }
};

// Get all questions with ratings for a specific meeting
exports.getQuestionsWithRatingsForMeeting = async (req, res) => {
  try {
    const meetingId = req.params.meetingId;
    
    if (!meetingId) {
      return res.status(400).send({ message: 'Meeting ID is required' });
    }

    console.log(`Getting questions with ratings for meeting ID: ${meetingId}`);
    
    try {
      // First check if meeting exists
      const meeting = await db.meeting.findByPk(meetingId);
      if (!meeting) {
        return res.status(404).send({ message: 'Meeting not found' });
      }
  
      // Use a simpler query to reduce complexity and potential errors
      const feedbacks = await Feedback.findAll({
        where: { meetingId: meetingId },
        include: [
          {
            model: Question,
            as: 'question',
            attributes: ['id', 'text', 'departmentId'],
            include: [{
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'fullName', 'email', 'year', 'departmentId'],
            include: [{
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }]
          }
        ]
      });
      
      console.log(`Found ${feedbacks.length} feedback entries for meeting ID: ${meetingId}`);
      
      // Group feedback by question ID
      const questions = {};
      
      // Process each feedback entry with defensive programming
      for (const feedback of feedbacks) {
        try {
          if (!feedback || !feedback.question || !feedback.question.id) {
            console.log('Skipping feedback without question:', feedback ? feedback.id : 'undefined');
            continue;
          }
          
          const questionId = feedback.question.id;
          
          // Initialize question in map if not already present
          if (!questions[questionId]) {
            questions[questionId] = {
              id: questionId,
              text: feedback.question.text || 'Unknown Question',
              departmentId: feedback.question.departmentId,
              departmentName: feedback.question.department ? feedback.question.department.name : 'Unknown Department',
              responses: [],
              totalRating: 0,
              totalResponses: 0,
              averageRating: 0
            };
          }
          
          // Create a simplified response object to avoid potential errors
          const responseObj = {
            id: feedback.id,
            rating: parseFloat(feedback.rating) || 0,
            notes: feedback.notes || '',
            userId: feedback.userId,
            userName: 'Anonymous'
          };
          
          // Safely add user information if available
          if (feedback.user) {
            responseObj.userName = feedback.user.fullName || feedback.user.username || 'Anonymous';
            responseObj.userEmail = feedback.user.email;
            responseObj.year = feedback.user.year;
            responseObj.departmentId = feedback.user.departmentId;
            responseObj.departmentName = feedback.user.department ? feedback.user.department.name : undefined;
            
            // Determine role based on username patterns
            if (feedback.user.username) {
              if (feedback.user.username.match(/^E\d/) || feedback.user.username.startsWith('ST')) {
                responseObj.role = 'student';
              } else if (feedback.user.username.match(/^S\d/) || feedback.user.username.includes('staff')) {
                responseObj.role = 'staff';
              } else {
                responseObj.role = 'unknown';
              }
            }
          }
          
          // Add the response to the question
          questions[questionId].responses.push(responseObj);
          
          // Update totals
          questions[questionId].totalRating += responseObj.rating;
          questions[questionId].totalResponses++;
        } catch (feedbackError) {
          console.error('Error processing feedback item:', feedbackError);
          // Continue processing other feedback items instead of failing completely
          continue;
        }
      }
      
      // Calculate averages and format array
      const result = Object.values(questions).map(question => {
        // Calculate average if totalResponses > 0
        if (question.totalResponses > 0) {
          question.averageRating = question.totalRating / question.totalResponses;
        }
        return question;
      });
      
      // Sort by average rating (highest first)
      result.sort((a, b) => b.averageRating - a.averageRating);
      
      console.log(`Successfully processed ${result.length} questions with ratings`);
      return res.status(200).send(result);
    } catch (queryError) {
      console.error('Database query error:', queryError);
      return res.status(500).send({
        message: 'Error retrieving data from database',
        error: queryError.message
      });
    }
  } catch (error) {
    console.error('Uncaught error in getQuestionsWithRatingsForMeeting:', error);
    return res.status(500).send({
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get meeting stats
exports.getMeetingStats = async (req, res) => {
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
    
    // Get all feedback for this meeting
    const feedback = await Feedback.findAll({
      where: { meetingId: meetingId },
      include: [
        {
          model: Question,
          as: 'question',
          attributes: ['id', 'text'],
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        }
      ]
    });
    
    // Calculate basic statistics
    const totalResponses = feedback.length;
    let totalRating = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    feedback.forEach(item => {
      totalRating += item.rating;
      ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + 1;
    });
    
    const averageRating = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 0;
    
    res.status(200).send({
      meetingId,
      meetingTitle: meeting.title,
      totalResponses,
      averageRating,
      ratingDistribution
    });
  } catch (error) {
    console.error('Error getting meeting stats:', error);
    res.status(500).send({ message: 'Error retrieving meeting stats', error: error.message });
  }
};

// Get detailed meeting stats including department and role breakdowns
exports.getMeetingDetailedStats = async (req, res) => {
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
    
    // Get all detailed feedback for this meeting
    const feedbackData = await Feedback.findAll({
      where: { meetingId: meetingId },
      include: [
        {
          model: Question,
          as: 'question',
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'year', 'departmentId'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            },
            {
              model: db.role,
              as: 'roles',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
    
    // Get all departments
    const departments = await Department.findAll({
      where: { active: true }
    });
    
    // Initialize statistics objects
    const departmentStats = [];
    let totalResponses = 0;
    let totalRating = 0;
    const overallRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    // Role-based statistics
    const roleStats = {
      student: { count: 0, totalRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      staff: { count: 0, totalRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
    };
    
    // Process all feedback data
    feedbackData.forEach(feedback => {
      // Overall stats
      totalResponses++;
      totalRating += feedback.rating;
      overallRatingDistribution[feedback.rating]++;
      
      // Process role-based stats
      const user = feedback.user;
      let roleCategory = 'other';
      
      if (user) {
        // Try to determine role
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
          const roleName = user.roles[0].name?.toLowerCase();
          if (roleName === 'student') roleCategory = 'student';
          else if (roleName === 'staff') roleCategory = 'staff';
        }
        
        // If no role found from roles array, try username pattern
        if (roleCategory === 'other' && user.username) {
          if (user.username.match(/^E\d/) || user.username.startsWith('ST')) {
            roleCategory = 'student';
          } else if (user.username.match(/^S\d/) || user.username.includes('staff')) {
            roleCategory = 'staff';
          }
        }
      }
      
      // Update role statistics
        roleStats[roleCategory].count++;
        roleStats[roleCategory].totalRating += feedback.rating;
        roleStats[roleCategory].ratingDistribution[feedback.rating]++;
    });
    
    // Calculate averages
    const overallAverageRating = totalResponses > 0 ? (totalRating / totalResponses).toFixed(2) : 0;
    
    // Calculate department averages
    departmentStats.forEach(dept => {
      dept.averageRating = dept.responses > 0 ? (dept.totalRating / dept.responses).toFixed(2) : 0;
    });
    
    // Calculate role averages
    Object.keys(roleStats).forEach(role => {
      roleStats[role].averageRating = roleStats[role].count > 0 
        ? (roleStats[role].totalRating / roleStats[role].count).toFixed(2)
        : 0;
    });
    
    res.status(200).send({
      meetingId,
      meetingTitle: meeting.title,
      totalResponses,
      overallAverageRating,
      overallRatingDistribution,
      departmentStats,
      roleStats
    });
  } catch (error) {
    console.error('Error getting detailed meeting stats:', error);
    res.status(500).send({ message: 'Error retrieving detailed meeting stats', error: error.message });
  }
};