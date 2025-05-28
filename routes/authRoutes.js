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

const ALLOWED_ROLES = ['student', 'teacher', 'admin'];
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
    const userRole = ALLOWED_ROLES.includes(role) ? role : 'student';
    const user   = await User.create({ username, email, password: hashed, role: userRole });

    res.status(201).json({ token: signToken(user) });
  })
);

/* ---------- login ---------- */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid credentials.' });

    res.json({ token: signToken(user) });
  })
);

// middlewares/protect.js – verifies JWT
const protect = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not logged in." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token." });
  }
};

// Reset Password Request Route
router.post("/reset-password", async (req, res) => {
    const { email } = req.body;

    try {
        // Validate email format
        if (!email || !email.includes("@")) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset token valid for 10 minutes
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        // Construct reset password link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,  // Your Gmail
                pass: process.env.APP_PASS     // App password (not normal password)
            }
        });

        // Send reset password email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Password Reset Request",
            html: `
                <p>Hello ${user.username},</p>
                <p>You requested a password reset.</p>
                <p>Click the link below to reset your password (valid for 10 minutes):</p>
                <a href="${resetLink}">Reset Password</a>
            `
        });

        res.status(200).json({ message: "Reset link sent to your email" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Confirm Reset Route
router.post("/confirm-reset", async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

         // Validate new password
         if (!isValidPassword(newPassword)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and include letters and numbers."
            });
        }

        // Verify the reset token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password reset successful" });

    } catch (error) {
        res.status(400).json({ message: "Invalid or expired token" });
    }
});

module.exports = router;