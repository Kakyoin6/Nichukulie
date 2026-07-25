const { validationResult } = require('express-validator');
const Errand = require('../models/Errand');

// POST /api/errands
exports.createErrand = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const errand = await Errand.create({ ...req.body, customer: req.user._id });
    res.status(201).json(errand);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/errands/my
exports.getMyErrands = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { customer: req.user._id };
  if (status) query.status = status;

  const errands = await Errand.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('runner', 'firstName lastName phone');
  const total = await Errand.countDocuments(query);

  res.json({ errands, total, pages: Math.ceil(total / limit) });
};

// GET /api/errands/track/:orderId
exports.trackErrand = async (req, res) => {
  const errand = await Errand.findOne({ orderId: req.params.orderId })
    .populate('runner', 'firstName lastName phone');
  if (!errand) return res.status(404).json({ message: 'Errand not found' });
  res.json(errand);
};

// GET /api/errands/:id
exports.getErrand = async (req, res) => {
  const errand = await Errand.findById(req.params.id).populate('runner customer', '-password');
  if (!errand) return res.status(404).json({ message: 'Not found' });
  res.json(errand);
};

// GET /api/errands (admin)
exports.getAllErrands = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};

  const errands = await Errand.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('customer runner', 'firstName lastName phone');
  const total = await Errand.countDocuments(query);

  res.json({ errands, total });
};

// PATCH /api/errands/:id (admin)
exports.updateErrand = async (req, res) => {
  const errand = await Errand.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!errand) return res.status(404).json({ message: 'Not found' });
  res.json(errand);
};
