const express = require('express');
const { body } = require('express-validator');
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getAppointmentStatistics
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createAppointmentValidation = [
  body('doctor')
    .isMongoId()
    .withMessage('Valid doctor ID is required'),
  body('appointmentDate')
    .isISO8601()
    .withMessage('Valid appointment date is required'),
  body('appointmentTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('Duration must be between 15 and 120 minutes'),
  body('type')
    .optional()
    .isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup'])
    .withMessage('Invalid appointment type'),
  body('chiefComplaint')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Chief complaint must be between 10 and 500 characters')
];

const updateAppointmentValidation = [
  body('appointmentDate')
    .optional()
    .isISO8601()
    .withMessage('Valid appointment date is required'),
  body('appointmentTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid status'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('Duration must be between 15 and 120 minutes')
];

// Routes
router.get('/statistics', authorize('doctor', 'admin'), getAppointmentStatistics);
router.get('/', getAppointments);
router.post('/', authorize('patient'), createAppointmentValidation, createAppointment);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointmentValidation, updateAppointment);
router.delete('/:id', cancelAppointment);

module.exports = router;