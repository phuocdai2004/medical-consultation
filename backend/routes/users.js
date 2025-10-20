const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserActiveStatus,
  verifyDoctor,
  getDoctors,
  getUserStatistics,
  getDoctorStats
} = require('../controllers/userController');
const { protect, authorize, checkDynamicOwnership } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/doctors', getDoctors);

// Doctor-specific routes
router.get('/doctor/stats', authorize('Doctor'), getDoctorStats);


// Protected routes
router.use(protect); // All routes below require authentication

// User can access their own profile, Admin can access any
router.get('/statistics', authorize('admin'), getUserStatistics);
router.get('/:id', checkDynamicOwnership('id'), getUserById);

// Admin only routes
router.get('/', authorize('admin'), getUsers);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.patch('/:id/toggle-active', authorize('admin'), toggleUserActiveStatus);
router.patch('/:id/verify-doctor', authorize('admin'), verifyDoctor);

module.exports = router;