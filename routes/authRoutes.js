const express      = require('express');
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const nodemailer   = require('nodemailer');
const asyncHandler = require('express-async-handler');
const User         = require('../models/User');

require('dotenv').config();
const router = express.Router();

/* ---------- utils ---------- */
const isValidPassword = (pw) =>
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pw);

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

/* ---------- sign-up ---------- */
router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required.' });

    if (!isValidPassword(password))
      return res.status(400).json({
        message: 'Password must be at least 8 chars and include letters & numbers.',
      });

    if (await User.findOne({ $or: [{ email }, { username }] }))
      return res.status(409).json({ message: 'Email or username already in use.' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ username, email, password: hashed, role });

    res.status(201).json({ token: signToken(user) });
  })
);

/* ---------- login ---------- */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: 'Invalid credentials.' });

    res.json({ token: signToken(user) });
  })
);

/* ---------- request reset link ---------- */
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '10m',
    });

    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.APP_PASS },
    });

    await transporter.sendMail({
      from   : process.env.EMAIL_USER,
      to     : user.email,
      subject: 'Password Reset',
      html   : `<a href="${process.env.FRONTEND_URL}/reset?token=${token}">Reset password</a>`,
    });

    res.json({ message: 'Reset link sent.' });
  })
);

/* ---------- confirm reset ---------- */
router.post(
  '/confirm-reset',
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    const user = await User.findOne({
      _id: payload.id,
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

    if (!isValidPassword(newPassword))
      return res.status(400).json({ message: 'Weak password.' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful.' });
  })
);

module.exports = router;
