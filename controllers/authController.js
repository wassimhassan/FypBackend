// controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const isValidPassword = (pw) =>
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pw);

const ALLOWED_ROLES = ['student', 'teacher', 'admin'];

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

exports.signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' });

  if (!isValidPassword(password))
    return res.status(400).json({
      message: 'Password must be at least 8 chars and include letters & numbers.',
    });

  if (await User.findOne({ $or: [{ email }, { username }] }))
    return res.status(409).json({ message: 'Email or username already in use.' });

  const hashed = await bcrypt.hash(password, 10);

  // Set role logic
  const teacherEmails = ['teacher@fekra.com']; // Add more as needed
  const userRole = teacherEmails.includes(email.toLowerCase()) ? 'teacher' : 'student';

  const user = await User.create({ username, email, password: hashed, role: userRole });

  res.status(201).json({ token: signToken(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
console.log("📥 Login payload received:", req.body);

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(400).json({ message: 'Invalid credentials.' });

  console.log("✅ User logged in:", {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
    username: user.username
  });

  res.json({ token: signToken(user) });
});

exports.resetPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '10m',
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.APP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <p>Hello ${user.username},</p>
      <p>You requested a password reset.</p>
      <p>Click below (valid 10 mins):</p>
      <a href="${resetLink}">Reset Password</a>
    `,
  });

  res.status(200).json({ message: 'Reset link sent to your email' });
});

exports.confirmReset = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters and include letters and numbers.',
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(200).json({ message: 'Password reset successful' });
});

exports.authCheck = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found.' });

  res.status(200).json({ message: 'Authenticated', user });
});

exports.logout = asyncHandler(async (req, res) => {
  res.status(200).json({ message: 'Logged out successfully. Remove token from frontend storage.' });
});