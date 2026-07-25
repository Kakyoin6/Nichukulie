const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  errand:     { type: mongoose.Schema.Types.ObjectId, ref: 'Errand' },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:     { type: Number, required: true },
  phone:      { type: String, required: true },
  mpesaRef:   { type: String, default: '' },
  checkoutId: { type: String, default: '' },
  status:     { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  type:       { type: String, enum: ['errand_payment', 'top_up', 'runner_payout'], default: 'errand_payment' },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);
