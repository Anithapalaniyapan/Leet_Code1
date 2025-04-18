const express = require('express');
const router = express.Router();
const hodResponseController = require('../controllers/hodResponse.controller');
const authJwt = require('../middleware/authJwt');

// Create/Update HOD response (HOD only)
router.post(
  '/',
  [authJwt.verifyToken, authJwt.isHOD],
  hodResponseController.createResponse
);

// Get responses for a specific question (Academic Director, Executive Director, HOD)
router.get(
  '/question/:questionId',
  [authJwt.verifyToken, (req, res, next) => {
    authJwt.isAcademicDirectorOrExecutiveDirector(req, res, (err) => {
      if (err) {
        authJwt.isHOD(req, res, next);
      } else {
        next();
      }
    });
  }],
  hodResponseController.getResponsesByQuestion
);

// Get all questions with HOD responses for a department
router.get(
  '/department/:departmentId',
  [authJwt.verifyToken, (req, res, next) => {
    authJwt.isAcademicDirectorOrExecutiveDirector(req, res, (err) => {
      if (err) {
        authJwt.isHOD(req, res, next);
      } else {
        next();
      }
    });
  }],
  hodResponseController.getQuestionsWithResponses
);

module.exports = router; 