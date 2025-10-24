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

// User profile routes - users can update their own profile
router.get('/me/profile', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/me/profile', async (req, res) => {
  try {
    const User = require('../models/User');
    const { password, role, isVerified, isActive, ...updateData } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Change password route
router.put('/me/change-password', async (req, res) => {
  try {
    const User = require('../models/User');
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

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