const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    date: {
      type: String, // Stored as YYYY-MM-DD for easy deduplication
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin who scanned
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one attendance log per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
