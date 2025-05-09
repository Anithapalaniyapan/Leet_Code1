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

// Get feedback by meeting ID
router.get(
  '/meeting/:meetingId',
  [authJwt.verifyToken],
  feedbackController.getFeedbackByMeeting
);

// Get feedback by meeting ID and current user
router.get(
  '/meeting/:meetingId/user',
  [authJwt.verifyToken],
  feedbackController.getFeedbackByMeetingAndUser
);

// Get meeting stats
router.get('/stats/meeting/:meetingId', [authJwt.verifyToken], feedbackController.getMeetingStats);
router.get('/stats/meeting/:meetingId/detailed', [authJwt.verifyToken], feedbackController.getMeetingDetailedStats);

// Get questions with ratings for a meeting
router.get('/meeting/:meetingId/questions/ratings', [authJwt.verifyToken], feedbackController.getQuestionsWithRatingsForMeeting);

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

// Generate Excel report for meeting-specific feedback (academic director and executive director only)
router.get(
  '/excel/meeting/:meetingId',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.generateMeetingFeedbackExcel
);

// Meeting-specific variants of all report types
// Generate meeting-specific Excel report for all feedback
router.get(
  '/excel/meeting/:meetingId/all',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.generateMeetingAllFeedbackExcel
);

// Generate meeting-specific Excel report for department statistics
router.get(
  '/excel/meeting/:meetingId/department/:departmentId',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.generateMeetingDepartmentStatsExcel
);

// Generate meeting-specific Excel report for overall statistics
router.get(
  '/excel/meeting/:meetingId/overall',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.generateMeetingOverallStatsExcel
);

// Generate meeting-specific Excel report for individual role reports
router.get(
  '/excel/meeting/:meetingId/individual/:roleType',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  feedbackController.generateMeetingIndividualReportExcel
);

module.exports = router;