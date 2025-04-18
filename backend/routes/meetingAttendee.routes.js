const { authJwt } = require('../middleware');
const controller = require('../controllers/meetingAttendee.controller');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  // Add attendees to a meeting (academic director only)
  app.post(
    '/api/meetings/attendees',
    [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
    controller.addAttendees
  );

  // Get all attendees for a meeting (academic director only)
  app.get(
    '/api/meetings/:meetingId/attendees',
    [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
    controller.getMeetingAttendees
  );

  // Mark attendance for a meeting (student/staff)
  app.post(
    '/api/meetings/:meetingId/attendance',
    [authJwt.verifyToken],
    controller.markAttendance
  );

  // Get meetings for a user (student/staff)
  app.get(
    '/api/user/meetings',
    [authJwt.verifyToken],
    controller.getUserMeetings
  );

  // Mark feedback as submitted
  app.post(
    '/api/meetings/:meetingId/feedback-submitted',
    [authJwt.verifyToken],
    controller.markFeedbackSubmitted
  );
};