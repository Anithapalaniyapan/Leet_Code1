const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const authJwt = require('../middleware/authJwt');

// Create a new question (academic director only)
router.post(
  '/',
  [authJwt.verifyToken, authJwt.isAcademicDirector],
  questionController.createQuestion
);

// Get all questions
router.get('/', [authJwt.verifyToken], questionController.getAllQuestions);

// Get latest questions for the current user
router.get(
  '/latest',
  [authJwt.verifyToken],
  questionController.getLatestQuestions
);

// Get questions by department (with optional role query parameter)
router.get(
  '/department/:departmentId',
  [authJwt.verifyToken],
  questionController.getQuestionsByDepartmentAndYear
);

// Get questions by department and year
router.get(
  '/department/:departmentId/year/:year',
  [authJwt.verifyToken],
  questionController.getQuestionsByDepartmentAndYear
);

// Update a question (academic director only)
router.put(
  '/:id',
  [authJwt.verifyToken, authJwt.isAcademicDirector],
  questionController.updateQuestion
);

// Delete a question (academic director only)
router.delete(
  '/:id',
  [authJwt.verifyToken, authJwt.isAcademicDirector],
  questionController.deleteQuestion
);

// Get questions created by a specific user
router.get(
  '/creator/:creatorId',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  questionController.getQuestionsByCreator
);

// Get questions by meeting ID
router.get(
  '/meeting/:meetingId',
  [authJwt.verifyToken],
  questionController.getQuestionsByMeeting
);

module.exports = router;