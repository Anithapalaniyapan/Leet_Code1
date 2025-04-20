const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const authJwt = require('../middleware/authJwt');

// Submit feedback (students and staff)
router.post(
  '/submit',
  [authJwt.verifyToken, authJwt.isStudentOrStaff],
  feedbackController.submitFeedback
);

// Get feedback by current user
router.get(
  '/my-feedback',
  [authJwt.verifyToken],
  feedbackController.getFeedbackByUser
);

// Get feedback by user ID (academic director and executive director only)
router.get(
  '/user/:userId',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.getFeedbackByUser
);

// Get feedback by question (academic director and executive director only)
router.get(
  '/question/:questionId',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.getFeedbackByQuestion
);

// Get feedback statistics by department (academic director and executive director only)
router.get(
  '/stats/department/:departmentId',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.getFeedbackStatsByDepartment
);

// Get all feedback in descending order (academic director and executive director only)
router.get(
  '/all',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.getAllFeedbackDescending
);

// Get overall feedback statistics (academic director and executive director only)
router.get(
  '/stats/overall',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.getOverallFeedbackStats
);

// EXCEL REPORT ENDPOINTS

// Generate Excel report for all feedback (academic director and executive director only)
router.get(
  '/excel/all',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.generateAllFeedbackExcel
);

// Generate Excel report for department statistics (academic director and executive director only)
router.get(
  '/excel/department/:departmentId',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.generateDepartmentStatsExcel
);

// Generate Excel report for overall statistics (academic director and executive director only)
router.get(
  '/excel/overall',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.generateOverallStatsExcel
);

// Generate Excel report for individual role reports (academic director and executive director only)
router.get(
  '/excel/individual/:roleType',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.generateIndividualReportExcel
);

module.exports = router;