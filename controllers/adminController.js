const User = require('../models/User');
const Errand = require('../models/Errand');
const Payment = require('../models/Payment');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalErrands, todayErrands, activeRunners, totalRevenue, pendingErrands] = await Promise.all([
    Errand.countDocuments(),
    Errand.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ role: 'runner', isActive: true }),
    Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Errand.countDocuments({ status: 'pending' }),
  ]);

  res.json({
    totalErrands,
    todayErrands,
    activeRunners,
    totalRevenue: totalRevenue[0]?.total || 0,
    pendingErrands,
  });
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  const users = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
  res.json(users);
};

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  res.json(user);
};

// GET /api/admin/runners
exports.getRunners = async (req, res) => {
  const runners = await User.find({ role: 'runner' }).select('-password');
  res.json(runners);
};
