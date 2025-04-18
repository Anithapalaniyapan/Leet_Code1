const db = require('../models');
const Question = db.question;
const Department = db.department;
const User = db.user;
const Role = db.role;

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

    // Create question
    const question = await Question.create({
      text: req.body.text,
      year: year, // Will be null for staff and both roles
      departmentId: req.body.departmentId,
      createdBy: req.userId,
      role: role,
      active: true
    });

    // Fetch the created question with department info
    const questionWithDept = await Question.findByPk(question.id, {
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }]
    });

    // Format response
    const formattedQuestion = {
      id: questionWithDept.id,
      text: questionWithDept.text,
      targetRole: questionWithDept.role,
      departmentId: questionWithDept.departmentId,
      department: questionWithDept.department ? questionWithDept.department.name : null,
      year: questionWithDept.year,
      roleId: questionWithDept.role === 'student' ? 1 : questionWithDept.role === 'staff' ? 2 : 3,
      active: questionWithDept.active
    };

    const newQuestionWithDetails = {
      ...formattedQuestion,
      role: questionWithDept.role,
      year: questionWithDept.role === 'student' ? parseInt(year) : null
    };

    res.status(201).send(newQuestionWithDetails);
  } catch (error) {
    console.error('Error in createQuestion:', error);
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
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }],
      attributes: [
        'id',
        'text',
        'role',
        'departmentId',
        'year',
        'active',
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
      active: q.active
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
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }],
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
      active: q.active
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
    const question = await Question.findByPk(id);

    if (!question) {
      return res.status(404).send({ message: 'Question not found' });
    }

    await question.destroy();
    res.status(200).send({ message: 'Question deleted successfully' });
  } catch (error) {
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