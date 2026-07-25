const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const { getStats, getUsers, updateUserStatus, getRunners } = require('../controllers/adminController');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/runners', getRunners);

module.exports = router;
