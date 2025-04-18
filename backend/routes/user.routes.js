const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authJwt = require('../middleware/authJwt');

// Get current user profile
router.get('/profile', [authJwt.verifyToken], userController.getCurrentUser);

// Get all users (admin and HOD)
router.get(
  '/all',
  [authJwt.verifyToken, (req, res, next) => {
    authJwt.isAcademicDirectorOrExecutiveDirector(req, res, (err) => {
      if (err) {
        authJwt.isHOD(req, res, next);
      } else {
        next();
      }
    });
  }],
  userController.getAllUsers
);

// Get user by ID
router.get('/:id', [authJwt.verifyToken], userController.getUserById);

// Update user
router.put('/:id', [authJwt.verifyToken], userController.updateUser);

// Delete user (admin only)
router.delete(
  '/:id',
  [authJwt.verifyToken, authJwt.isAcademicDirectorOrExecutiveDirector],
  userController.deleteUser
);

// Get users by department
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
  userController.getUsersByDepartment
);

// Get users by year
router.get(
  '/year/:year',
  [authJwt.verifyToken, (req, res, next) => {
    authJwt.isAcademicDirectorOrExecutiveDirector(req, res, (err) => {
      if (err) {
        authJwt.isHOD(req, res, next);
      } else {
        next();
      }
    });
  }],
  userController.getUsersByYear
);

module.exports = router;