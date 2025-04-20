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

    if (question.year !== user.year) {
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

    if (existingFeedback) {
      // Update existing feedback
      await existingFeedback.update({
        rating: req.body.rating,
        notes: req.body.notes || existingFeedback.notes,
        submittedAt: new Date()
      });

      return res.status(200).send({
        message: 'Feedback updated successfully',
        feedback: existingFeedback
      });
    }

    // Create new feedback with optional meetingId
    const feedback = await Feedback.create({
      rating: req.body.rating,
      notes: req.body.notes,
      userId: req.userId,
      questionId: req.body.questionId,
      meetingId: req.body.meetingId || null // Add support for meetingId
    });

    res.status(201).send({
      message: 'Feedback submitted successfully',
      feedback: feedback
    });
  } catch (error) {
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

// Get overall feedback statistics (for academic and executive directors)
exports.getOverallFeedbackStats = async (req, res) => {
  try {
    // Check if user has academic or executive director role
    if (!req.userRoles.includes('ROLE_ACADEMIC_DIRECTOR') && !req.userRoles.includes('ROLE_EXECUTIVE_DIRECTOR')) {
      return res.status(403).send({ message: 'Unauthorized to view overall feedback statistics' });
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

    res.status(200).send({
      totalResponses: totalResponses,
      overallAverageRating: overallAverageRating,
      overallRatingDistribution: overallRatingDistribution,
      departmentStats: departmentStats
    });
  } catch (error) {
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

    // Style headers
    [1, 6, 13].forEach(rowIndex => {
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
          include: [{
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }]
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
      
      // Simple pattern matching for username to determine role
      if (user.username.match(/^E\d/) || user.username.startsWith('ST')) {
        userRoleId = 1; // student
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
    
    // Add title
    worksheet.getCell(`A${currentRow}`).value = `${roleName} Individual Feedback Report`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
    currentRow += 2;
    
    // For each department
    Object.entries(departmentData).forEach(([deptId, dept]) => {
      worksheet.getCell(`A${currentRow}`).value = `Department: ${dept.name}`;
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow += 2;
      
      // For each user in the department
      Object.values(dept.users).forEach(user => {
        worksheet.getCell(`A${currentRow}`).value = `User: ${user.name}`;
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        currentRow++;
        
        if (roleType === 'student' && user.year) {
          worksheet.getCell(`A${currentRow}`).value = `Year: ${user.year}`;
          currentRow++;
        }
        
        worksheet.getCell(`A${currentRow}`).value = `User ID: ${user.id}`;
        currentRow += 2;
        
        // Add feedback headers
        const headers = ['Question ID', 'Question', 'Rating', 'Notes', 'Submitted Date'];
        worksheet.getRow(currentRow).values = headers;
        worksheet.getRow(currentRow).font = { bold: true };
        currentRow++;
        
        // Add feedback rows
        user.feedback.forEach(item => {
          worksheet.getRow(currentRow).values = [
            item.questionId,
            item.questionText,
            item.rating,
            item.notes || '',
            new Date(item.submittedAt).toLocaleString()
          ];
          currentRow++;
        });
        
        // Calculate average rating for this user
        const totalRating = user.feedback.reduce((sum, item) => sum + item.rating, 0);
        const averageRating = user.feedback.length > 0 ? (totalRating / user.feedback.length).toFixed(2) : 'N/A';
        
        currentRow++;
        worksheet.getCell(`A${currentRow}`).value = `Average Rating: ${averageRating}`;
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        currentRow += 2;
        
        // Add separator between users
        worksheet.getCell(`A${currentRow}`).value = '-------------------------';
        currentRow += 2;
      });
      
      // Add separator between departments
      worksheet.getCell(`A${currentRow}`).value = '=========================';
      currentRow += 2;
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${roleName.toLowerCase()}_individual_report.xlsx`);
    
    // Send the workbook as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating individual report Excel:', error);
    res.status(500).send({ message: error.message });
  }
};