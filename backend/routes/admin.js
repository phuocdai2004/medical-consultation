const express = require('express');
const router = express.Router();
const {
    getStats,
    getUsers,
    createUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    getAppointments,
    cancelAppointment
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes in this file are protected and for admins only
router.use(protect, authorize('admin'));

// Dashboard Stats
router.get('/stats', getStats);

// User Management
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Appointment Management
router.get('/appointments', getAppointments);
router.put('/appointments/:id/cancel', cancelAppointment);

module.exports = router;