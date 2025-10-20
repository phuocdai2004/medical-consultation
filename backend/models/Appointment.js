const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  duration: {
    type: Number,
    default: 30, // minutes
    min: [15, 'Minimum appointment duration is 15 minutes'],
    max: [120, 'Maximum appointment duration is 120 minutes']
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup'],
    default: 'consultation'
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Symptoms and chief complaint
  chiefComplaint: {
    type: String,
    required: [true, 'Chief complaint is required'],
    maxlength: [500, 'Chief complaint cannot exceed 500 characters']
  },
  symptoms: [{
    symptom: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    duration: String,
    notes: String
  }],
  
  // Pre-appointment information
  vitalSigns: {
    temperature: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    weight: Number,
    height: Number
  },
  
  // Consultation notes (filled by doctor)
  doctorNotes: {
    diagnosis: String,
    treatment: String,
    prescription: [{
      medication: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    followUpRequired: { type: Boolean, default: false },
    followUpDate: Date,
    additionalNotes: String
  },
  
  // Payment information
  fee: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank-transfer', 'insurance']
  },
  
  // Communication
  meetingLink: String, // for video consultations
  meetingId: String,
  
  // Ratings and feedback
  patientRating: {
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    ratedAt: Date
  },
  
  // Cancellation information
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  
  // Reminder settings
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: Date

}, {
  timestamps: true
});

// Indexes for better performance
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });

// Virtual for full appointment datetime
appointmentSchema.virtual('fullDateTime').get(function() {
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Virtual for appointment end time
appointmentSchema.virtual('endTime').get(function() {
  const startTime = this.fullDateTime;
  const endTime = new Date(startTime.getTime() + (this.duration * 60 * 1000));
  return endTime;
});

// Check if appointment slot is available
appointmentSchema.statics.isSlotAvailable = async function(doctorId, appointmentDate, appointmentTime, duration = 30, excludeId = null) {
  const startTime = new Date(appointmentDate);
  const [hours, minutes] = appointmentTime.split(':');
  startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const endTime = new Date(startTime.getTime() + (duration * 60 * 1000));
  
  const query = {
    doctor: doctorId,
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    $or: [
      {
        appointmentDate: appointmentDate,
        $expr: {
          $and: [
            { $lt: [
              { $dateFromParts: {
                year: { $year: '$appointmentDate' },
                month: { $month: '$appointmentDate' },
                day: { $dayOfMonth: '$appointmentDate' },
                hour: { $toInt: { $substr: ['$appointmentTime', 0, 2] } },
                minute: { $toInt: { $substr: ['$appointmentTime', 3, 2] } }
              }},
              endTime
            ]},
            { $gt: [
              { $add: [
                { $dateFromParts: {
                  year: { $year: '$appointmentDate' },
                  month: { $month: '$appointmentDate' },
                  day: { $dayOfMonth: '$appointmentDate' },
                  hour: { $toInt: { $substr: ['$appointmentTime', 0, 2] } },
                  minute: { $toInt: { $substr: ['$appointmentTime', 3, 2] } }
                }},
                { $multiply: ['$duration', 60000] }
              ]},
              startTime
            ]}
          ]
        }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const conflictingAppointments = await this.find(query);
  return conflictingAppointments.length === 0;
};

// Pre-save validation
appointmentSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('appointmentDate') || this.isModified('appointmentTime') || this.isModified('duration')) {
    // Check if the slot is available
    const isAvailable = await this.constructor.isSlotAvailable(
      this.doctor,
      this.appointmentDate,
      this.appointmentTime,
      this.duration,
      this._id
    );
    
    if (!isAvailable) {
      const error = new Error('The selected time slot is not available');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  
  // Validate appointment is in the future
  const appointmentDateTime = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.split(':');
  appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (appointmentDateTime <= new Date()) {
    const error = new Error('Appointment must be scheduled for a future date and time');
    error.name = 'ValidationError';
    return next(error);
  }
  
  next();
});

// Populate patient and doctor info by default
appointmentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'patient',
    select: 'fullName email phone avatar dateOfBirth gender'
  }).populate({
    path: 'doctor',
    select: 'fullName email specialization experience consultationFee rating avatar'
  });
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);