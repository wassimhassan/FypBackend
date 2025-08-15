// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  resetPasswordRequest,
  confirmReset,
  authCheck,
  logout
} = require('../controllers/authController');

const { protect, requireRole } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/reset-password', resetPasswordRequest);
router.post('/confirm-reset', confirmReset);
router.get('/auth-check', protect, authCheck);
router.post('/logout', logout);

module.exports = router;
