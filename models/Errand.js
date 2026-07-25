const mongoose = require('mongoose');

const ErrandSchema = new mongoose.Schema({
  orderId:        { type: String, unique: true },
  customer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  runner:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type:           { type: String, enum: ['shopping', 'pharmacy', 'documents', 'package', 'food', 'custom'], required: true },
  description:    { type: String, default: '' },
  pickup:         { type: String, required: true },
  delivery:       { type: String, required: true },
  pickupCounty:   { type: String, default: 'Nairobi' },
  deliveryCounty: { type: String, default: 'Nairobi' },
  serviceLevel:   { type: String, enum: ['same_day', 'scheduled', 'intercounty', 'express'], default: 'same_day' },
  distanceKm:     { type: Number, default: 0 },
  scheduledDate:  { type: Date, required: true },
  timeSlot:       { type: String },
  notes:          { type: String, default: '' },
  status:         { type: String, enum: ['pending', 'assigned', 'active', 'completed', 'cancelled'], default: 'pending' },
  price: {
    base:     { type: Number, default: 200 },
    distance: { type: Number, default: 50 },
    service:  { type: Number, default: 30 },
    total:    { type: Number, required: true },
  },
  payment: {
    status:   { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    method:   { type: String, default: 'mpesa' },
    mpesaRef: { type: String, default: '' },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ErrandSchema.pre('save', function (next) {
  if (!this.orderId) {
    this.orderId = 'NCK-' + Date.now().toString().slice(-8);
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Errand', ErrandSchema);
