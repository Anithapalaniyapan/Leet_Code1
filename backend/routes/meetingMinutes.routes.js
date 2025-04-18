const { authJwt } = require('../middleware');
const controller = require('../controllers/meetingMinutes.controller');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  // Create meeting minutes
  app.post(
    '/api/meeting-minutes',
    [authJwt.verifyToken],
    controller.createMeetingMinutes
  );

  // Get meeting minutes by meeting ID
  app.get(
    '/api/meeting-minutes/meeting/:meetingId',
    [authJwt.verifyToken],
    controller.getMeetingMinutesByMeetingId
  );

  // Get meeting minutes by ID
  app.get(
    '/api/meeting-minutes/:id',
    [authJwt.verifyToken],
    controller.getMeetingMinutesById
  );

  // Update meeting minutes
  app.put(
    '/api/meeting-minutes/:id',
    [authJwt.verifyToken],
    controller.updateMeetingMinutes
  );

  // Delete meeting minutes
  app.delete(
    '/api/meeting-minutes/:id',
    [authJwt.verifyToken],
    controller.deleteMeetingMinutes
  );
};