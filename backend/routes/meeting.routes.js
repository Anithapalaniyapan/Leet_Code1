const { authJwt } = require('../middleware');
const controller = require('../controllers/meeting.controller');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  // Create a new meeting - restricted to Academic Directors only
  app.post(
    '/api/meetings',
    [authJwt.verifyToken, authJwt.isAcademicDirector],
    controller.createMeeting
  );

  // Get all meetings
  app.get(
    '/api/meetings',
    [authJwt.verifyToken],
    controller.getAllMeetings
  );

  // Get meetings specific to the current user based on role, department, and year
  app.get(
    '/api/meetings/user/current',
    [authJwt.verifyToken],
    controller.getMeetingsForCurrentUser
  );

  // Get meetings by department
  app.get(
    '/api/meetings/department/:departmentId',
    [authJwt.verifyToken, authJwt.isHOD],
    controller.getMeetingsByDepartment
  );

  // Get meetings by department and year
  app.get(
    '/api/meetings/department/:departmentId/year/:year',
    [authJwt.verifyToken],
    controller.getMeetingsByDepartmentAndYear
  );

  // Get meeting by ID
  app.get(
    '/api/meetings/:id',
    [authJwt.verifyToken],
    controller.getMeetingById
  );

  // Update meeting - restricted to Academic Directors only
  app.put(
    '/api/meetings/:id',
    [authJwt.verifyToken, authJwt.isAcademicDirector],
    controller.updateMeeting
  );

  // Delete meeting - restricted to Academic Directors only
  app.delete(
    '/api/meetings/:id',
    [authJwt.verifyToken, authJwt.isAcademicDirector],
    controller.deleteMeeting
  );
};