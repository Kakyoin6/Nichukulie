const express = require('express');
const { protect } = require('../middleware/auth');
const { mpesaLimiter } = require('../middleware/rateLimiter');
const { stkPush, handleCallback, getPaymentStatus } = require('../controllers/mpesaController');

const router = express.Router();

router.post('/stkpush', protect, mpesaLimiter, stkPush);
router.post('/callback', handleCallback); // called by Safaricom, no auth — see security note in mpesaController.js
router.get('/status/:checkoutId', protect, getPaymentStatus);

module.exports = router;
