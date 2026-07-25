const express = require('express');
const { body } = require('express-validator');
const { protect, adminOnly } = require('../middleware/auth');
const {
  createErrand,
  getMyErrands,
  trackErrand,
  getErrand,
  getAllErrands,
  updateErrand,
} = require('../controllers/errandController');

const router = express.Router();

router.post('/', protect, [
  body('type').isIn(['shopping', 'pharmacy', 'documents', 'package', 'food', 'custom']),
  body('pickup').notEmpty(),
  body('delivery').notEmpty(),
  body('pickupCounty').optional().isString(),
  body('deliveryCounty').optional().isString(),
  body('serviceLevel').optional().isIn(['same_day', 'scheduled', 'intercounty', 'express']),
  body('distanceKm').optional().isNumeric(),
  body('scheduledDate').isISO8601(),
  body('price.total').isNumeric(),
], createErrand);

router.get('/my', protect, getMyErrands);
router.get('/track/:orderId', trackErrand);
router.get('/:id', protect, getErrand);

router.get('/', protect, adminOnly, getAllErrands);
router.patch('/:id', protect, adminOnly, updateErrand);

module.exports = router;
