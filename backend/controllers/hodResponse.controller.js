const db = require('../models');
const HODResponse = db.hodResponse;
const Question = db.question;
const User = db.user;
const Department = db.department;

// Create a new HOD response
exports.createResponse = async (req, res) => {
  try {
    const { questionId, response } = req.body;
    const userId = req.userId; // From JWT token

    // Get user's department
    const user = await User.findByPk(userId, {
      include: [{
        model: Department,
        as: 'department'
      }]
    });

    if (!user || !user.department) {
      return res.status(400).send({
        message: "HOD's department not found"
      });
    }

    // Check if response already exists
    const existingResponse = await HODResponse.findOne({
      where: {
        questionId,
        hodId: userId
      }
    });

    if (existingResponse) {
      // Update existing response
      await existingResponse.update({
        response
      });
      return res.send({
        message: "Response updated successfully",
        data: existingResponse
      });
    }

    // Create new response
    const hodResponse = await HODResponse.create({
      questionId,
      response,
      hodId: userId,
      departmentId: user.department.id
    });

    res.status(201).send({
      message: "Response submitted successfully",
      data: hodResponse
    });
  } catch (error) {
    console.error('Error in createResponse:', error);
    res.status(500).send({
      message: error.message || "Some error occurred while submitting the response."
    });
  }
};

// Get responses for a specific question
exports.getResponsesByQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const responses = await HODResponse.findAll({
      where: { questionId },
      include: [
        {
          model: User,
          as: 'hod',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ]
    });

    res.send(responses);
  } catch (error) {
    console.error('Error in getResponsesByQuestion:', error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving responses."
    });
  }
};

// Get all questions with HOD responses for a department
exports.getQuestionsWithResponses = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const questions = await Question.findAll({
      where: { departmentId },
      include: [
        {
          model: HODResponse,
          as: 'hodResponse',
          include: [
            {
              model: User,
              as: 'hod',
              attributes: ['id', 'fullName', 'email']
            },
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.send(questions);
  } catch (error) {
    console.error('Error in getQuestionsWithResponses:', error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving questions and responses."
    });
  }
}; 