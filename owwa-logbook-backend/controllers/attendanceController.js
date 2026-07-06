const Attendance = require('../models/Attendance');
const User = require('../models/User');

/**
 * Determine which slot to fill next based on current record state.
 * Order: morningIn → morningOut → afternoonIn → afternoonOut
 * Returns { slot, label } or null if all slots are filled.
 */
function nextSlot(record) {
  if (!record.morningIn)    return { slot: 'morningIn',    label: 'Morning In' };
  if (!record.morningOut)   return { slot: 'morningOut',   label: 'Morning Out' };
  if (!record.afternoonIn)  return { slot: 'afternoonIn',  label: 'Afternoon In' };
  if (!record.afternoonOut) return { slot: 'afternoonOut', label: 'Afternoon Out' };
  return null;
}

// @desc    Log attendance via QR scan (auto-fills next available slot)
// @route   POST /api/attendance/log
// @access  Admin
const logAttendance = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  try {
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found. Invalid QR code.' });

    if (user.status !== 'approved') {
      return res.status(403).json({
        message: `Cannot log: account is ${user.status}`,
        user: { firstName: user.firstName, lastName: user.lastName },
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Find or create today's record
    let record = await Attendance.findOne({ userId, date: today });
    if (!record) {
      record = new Attendance({ userId, date: today, scannedBy: req.user._id });
    }

    const next = nextSlot(record);
    if (!next) {
      return res.status(409).json({
        message: `All log slots for ${user.firstName} ${user.lastName} are filled for today.`,
        allFilled: true,
        user: { firstName: user.firstName, lastName: user.lastName },
        record,
      });
    }

    record[next.slot] = now;
    record.scannedBy = req.user._id;
    record.computeTotal();
    await record.save();

    // Build human-readable summary of the day so far
    const summary = buildSummary(record);

    res.status(200).json({
      message: `${user.firstName} ${user.lastName} — ${next.label} logged at ${now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`,
      slot: next.slot,
      label: next.label,
      record,
      summary,
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
      return res.status(409).json({ message: 'Duplicate entry error — please try again.' });
    }
    res.status(500).json({ message: 'Server error logging attendance' });
  }
};

function buildSummary(record) {
  const fmt = (d) => d ? new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—';
  return {
    morningIn:    fmt(record.morningIn),
    morningOut:   fmt(record.morningOut),
    afternoonIn:  fmt(record.afternoonIn),
    afternoonOut: fmt(record.afternoonOut),
    totalMinutes: record.totalMinutes,
    totalFormatted: formatMinutes(record.totalMinutes),
  };
}

function formatMinutes(mins) {
  if (!mins) return '0h 0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Admin
const getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, userId, page = 1, limit = 50 } = req.query;
    let query = {};
    if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
    else if (startDate) query.date = { $gte: startDate };
    else if (endDate)   query.date = { $lte: endDate };
    if (userId) query.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate('userId', 'firstName lastName email owwaId phone')
        .populate('scannedBy', 'firstName lastName')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(query),
    ]);

    res.json({ records, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
};

// @desc    Get today's attendance
// @route   GET /api/attendance/today
// @access  Admin
const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const records = await Attendance.find({ date: today })
      .populate('userId', 'firstName lastName email owwaId')
      .sort({ updatedAt: -1 });
    res.json({ date: today, count: records.length, records });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged-in user's own attendance
// @route   GET /api/attendance/my
// @access  Private (approved)
const getMyAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      Attendance.find({ userId: req.user._id }).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Attendance.countDocuments({ userId: req.user._id }),
    ]);
    res.json({ records, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Admin
const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { logAttendance, getAllAttendance, getMyAttendance, getTodayAttendance, deleteAttendance };
