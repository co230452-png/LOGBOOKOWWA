const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Log attendance via QR scan
// @route   POST /api/attendance/log
// @access  Admin
const logAttendance = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Find the user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found. Invalid QR code.' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({
        message: `Cannot log attendance: account is ${user.status}`,
        user: { firstName: user.firstName, lastName: user.lastName },
      });
    }

    // Get today's date string YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Check for duplicate attendance today
    const existing = await Attendance.findOne({ userId, date: today });
    if (existing) {
      return res.status(409).json({
        message: `${user.firstName} ${user.lastName} has already been logged today (${existing.timestamp.toLocaleTimeString()})`,
        alreadyLogged: true,
        user: { firstName: user.firstName, lastName: user.lastName },
        attendance: existing,
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      userId,
      date: today,
      timestamp: new Date(),
      scannedBy: req.user._id,
    });

    res.status(201).json({
      message: `Attendance logged for ${user.firstName} ${user.lastName}`,
      attendance,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        owwaId: user.owwaId,
      },
    });
  } catch (error) {
    console.error('Log attendance error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Attendance already logged for today' });
    }
    res.status(500).json({ message: 'Server error logging attendance' });
  }
};

// @desc    Get all attendance records with optional filters
// @route   GET /api/attendance
// @access  Admin
const getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, userId, page = 1, limit = 50 } = req.query;

    let query = {};

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    if (userId) {
      query.userId = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate('userId', 'firstName lastName email owwaId phone')
        .populate('scannedBy', 'firstName lastName')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(query),
    ]);

    res.json({
      records,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
};

// @desc    Get attendance for the logged-in user
// @route   GET /api/attendance/my
// @access  Private (approved user)
const getMyAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      Attendance.find({ userId: req.user._id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      records,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching your attendance' });
  }
};

// @desc    Get today's attendance summary
// @route   GET /api/attendance/today
// @access  Admin
const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const records = await Attendance.find({ date: today })
      .populate('userId', 'firstName lastName email owwaId')
      .sort({ timestamp: -1 });

    res.json({ date: today, count: records.length, records });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching today attendance' });
  }
};

// @desc    Delete an attendance record
// @route   DELETE /api/attendance/:id
// @access  Admin
const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    res.json({ message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting attendance' });
  }
};

module.exports = {
  logAttendance,
  getAllAttendance,
  getMyAttendance,
  getTodayAttendance,
  deleteAttendance,
};
