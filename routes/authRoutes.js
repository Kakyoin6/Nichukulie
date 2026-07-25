const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, getMe } = require('../controllers/authController');

const router = express.Router();

router.post('/register', authLimiter, [
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').matches(/^(\+254|0)(7|1)\d{8}$/).withMessage('Valid Kenyan phone required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Min 8 characters')
    .matches(/\d/).withMessage('Must contain a number')
    .matches(/[^a-zA-Z0-9]/).withMessage('Must contain a special character'),
], register);

router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], login);

router.get('/me', protect, getMe);

module.exports = router;
