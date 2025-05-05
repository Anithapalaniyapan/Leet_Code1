const db = require('../models');
const HODResponse = db.hodResponse;
const Question = db.question;
const User = db.user;
const Department = db.department;

// Create a new HOD response
exports.createResponse = async (req, res) => {
  try {
    const { questionId, response, meetingId, departmentId } = req.body;
    const userId = req.userId; // From JWT token

    // Validate required fields
    if (!questionId) {
      return res.status(400).send({
        message: "Question ID is required"
      });
    }

    // Get user's department if not provided
    let userDepartmentId = departmentId;
    if (!userDepartmentId) {
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
      
      userDepartmentId = user.department.id;
    }

    console.log('Creating/updating HOD response:', {
      questionId,
      meetingId,
      departmentId: userDepartmentId,
      hodId: userId
    });

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
        response,
        meetingId: meetingId || existingResponse.meetingId,
        departmentId: userDepartmentId || existingResponse.departmentId
      });
      
      console.log('Updated existing response:', existingResponse.id);
      
      return res.send({
        message: "Response updated successfully",
        data: existingResponse
      });
    }

    // Create new response
    const hodResponse = await HODResponse.create({
      questionId,
      response,
      meetingId,
      hodId: userId,
      departmentId: userDepartmentId,
      responded: true,
      respondedAt: new Date()
    });

    console.log('Created new response:', hodResponse.id);

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

// Get all meetings responded to by a HOD for a specific department
exports.getMeetingsRespondedByHOD = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const hodId = req.userId; // From JWT token

    console.log(`Fetching responded meetings for HOD ${hodId} in department ${departmentId}`);

    // Get all HOD responses for this department and HOD that have a meetingId
    try {
      // First approach: Try using findAll with attributes and raw query
      const responses = await db.sequelize.query(
        `SELECT DISTINCT "meetingId" FROM "hod_responses" 
         WHERE "departmentId" = ? AND "hodId" = ? AND "meetingId" IS NOT NULL`,
        {
          replacements: [departmentId, hodId],
          type: db.sequelize.QueryTypes.SELECT
        }
      );
      
      console.log(`Found ${responses.length} responses using direct query`);
      
      if (responses && responses.length > 0) {
        return res.send(responses);
      }
    } catch (primaryError) {
      console.error('Error in primary query:', primaryError);
      // Continue to fallback approach
    }

    // Second approach: Try a different SQL dialect approach
    try {
      const directResponses = await db.sequelize.query(
        `SELECT DISTINCT meeting_id as "meetingId" FROM meeting_hod_responses 
         WHERE department_id = ? AND hod_id = ?`,
        {
          replacements: [departmentId, hodId],
          type: db.sequelize.QueryTypes.SELECT
        }
      );
      
      console.log(`Found ${directResponses?.length || 0} responses using fallback query`);
      
      if (directResponses && directResponses.length > 0) {
        return res.send(directResponses);
      }
    } catch (fallbackError) {
      console.error('Error in fallback query:', fallbackError);
    }

    // Third approach: Use simpler query without GROUP BY
    try {
      const simpleResponses = await HODResponse.findAll({
        where: { 
          departmentId,
          hodId,
          meetingId: {
            [db.Sequelize.Op.not]: null
          }
        },
        attributes: ['meetingId'],
        raw: true
      });
      
      console.log(`Found ${simpleResponses.length} responses using simple query`);
      
      // Remove duplicates manually
      const uniqueMeetingIds = [...new Set(simpleResponses.map(r => r.meetingId))];
      const formattedResponses = uniqueMeetingIds.map(id => ({ meetingId: id }));
      
      return res.send(formattedResponses);
    } catch (simpleError) {
      console.error('Error in simple query:', simpleError);
    }

    // If all approaches fail, return empty array
    console.log('All query approaches failed, returning empty array');
    res.send([]);
  } catch (error) {
    console.error('Error in getMeetingsRespondedByHOD:', error);
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving responded meetings."
    });
  }
}; 