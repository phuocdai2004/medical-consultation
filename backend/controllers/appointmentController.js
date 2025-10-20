const Appointment = require('../models/Appointment');
const User = require('../models/User');
const emailService = require('../utils/emailService');
const { validationResult } = require('express-validator');

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private (Patient only)
const createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      doctor,
      appointmentDate,
      appointmentTime,
      duration = 30,
      type = 'consultation',
      chiefComplaint,
      symptoms,
      vitalSigns
    } = req.body;

    // Verify doctor exists and is verified
    const doctorUser = await User.findOne({
      _id: doctor,
      role: 'doctor',
      isActive: true,
      isVerified: true
    });

    if (!doctorUser) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not verified'
      });
    }

    // Check if slot is available
    const isAvailable = await Appointment.isSlotAvailable(
      doctor,
      appointmentDate,
      appointmentTime,
      duration
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'The selected time slot is not available'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor,
      appointmentDate,
      appointmentTime,
      duration,
      type,
      chiefComplaint,
      symptoms,
      vitalSigns,
      fee: doctorUser.consultationFee
    });

    // Send confirmation email to patient
    try {
      await emailService.sendAppointmentConfirmation(
        req.user.email,
        req.user.fullName,
        doctorUser.fullName,
        appointmentDate,
        appointmentTime
      );
    } catch (emailError) {
      console.error('Failed to send appointment confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating appointment'
    });
  }
};

// @desc    Get appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      startDate,
      endDate,
      doctor,
      patient,
      sortBy = 'appointmentDate',
      sortOrder = 'asc'
    } = req.query;

    // Build query based on user role
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }
    // Admin can see all appointments (no additional filter)

    // Add filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (doctor && req.user.role === 'admin') query.doctor = doctor;
    if (patient && req.user.role === 'admin') query.patient = patient;

    // Date range filter
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const appointments = await Appointment.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private (Own appointment or Admin)
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user has access to this appointment
    const userId = req.user._id.toString();
    const patientId = appointment.patient._id.toString();
    const doctorId = appointment.doctor._id.toString();

    if (req.user.role !== 'admin' && userId !== patientId && userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment'
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    const userId = req.user._id.toString();
    const patientId = appointment.patient._id.toString();
    const doctorId = appointment.doctor._id.toString();

    if (req.user.role !== 'admin' && userId !== patientId && userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Different update permissions based on role
    let allowedFields = [];
    
    if (req.user.role === 'patient' || userId === patientId) {
      allowedFields = ['appointmentDate', 'appointmentTime', 'symptoms', 'vitalSigns', 'chiefComplaint'];
      // Patients can only update if appointment is not confirmed or completed
      if (!['scheduled', 'confirmed'].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update appointment in current status'
        });
      }
    } else if (req.user.role === 'doctor' || userId === doctorId) {
      allowedFields = ['status', 'doctorNotes', 'meetingLink', 'meetingId'];
    } else if (req.user.role === 'admin') {
      allowedFields = Object.keys(req.body); // Admin can update everything
    }

    // Filter update data
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // If updating date/time, check availability
    if (updateData.appointmentDate || updateData.appointmentTime) {
      const isAvailable = await Appointment.isSlotAvailable(
        appointment.doctor._id,
        updateData.appointmentDate || appointment.appointmentDate,
        updateData.appointmentTime || appointment.appointmentTime,
        updateData.duration || appointment.duration,
        appointment._id
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'The selected time slot is not available'
        });
      }
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment'
    });
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    const userId = req.user._id.toString();
    const patientId = appointment.patient._id.toString();
    const doctorId = appointment.doctor._id.toString();

    if (req.user.role !== 'admin' && userId !== patientId && userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Cannot cancel completed appointments
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointment'
      });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledBy = req.user._id;
    appointment.cancelledAt = new Date();

    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling appointment'
    });
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/statistics
// @access  Private (Doctor/Admin)
const getAppointmentStatistics = async (req, res) => {
  try {
    let matchStage = {};

    // Filter by user role
    if (req.user.role === 'doctor') {
      matchStage.doctor = req.user._id;
    }
    // Admin sees all statistics

    const stats = await Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          noShow: { $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] } },
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'completed'] }, 
                '$fee', 
                0
              ] 
            } 
          }
        }
      }
    ]);

    // Monthly statistics
    const monthlyStats = await Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$appointmentDate' },
            month: { $month: '$appointmentDate' }
          },
          count: { $sum: 1 },
          revenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'completed'] }, 
                '$fee', 
                0
              ] 
            } 
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {
          total: 0,
          scheduled: 0,
          confirmed: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0,
          totalRevenue: 0
        },
        monthlyStats
      }
    });
  } catch (error) {
    console.error('Get appointment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getAppointmentStatistics
};