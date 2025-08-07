// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET all users (excluding password)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -resetToken -resetTokenExpires");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// GET all teachers
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("-password -resetToken -resetTokenExpires");
    res.status(200).json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch teachers", error: err.message });
  }
};


exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role, phoneNumber, profilePicture } = req.body;

    console.log("Incoming user:", req.body);

    if (!username || !email || !password || !role)
      return res.status(400).json({ message: "All fields are required." });

    const isValidPassword = (pw) =>
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pw);

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include letters & numbers.",
      });
    }

    // ✅ Check email separately
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already in use." });
    }

    // ✅ Check username separately
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      phoneNumber: phoneNumber || "",
      profilePicture:
        profilePicture || "https://fekra.s3.eu-north-1.amazonaws.com/default.png",
    });

    res.status(201).json({ message: "User created successfully", userId: newUser._id });
  } catch (err) {
    console.error("❌ Create user error:", err);
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
};
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phoneNumber, role, profilePicture, password } = req.body;

    const updateFields = {
      username,
      email,
      phoneNumber,
      role,
      profilePicture,
    };

    // ✅ Check for duplicate email in other users
    const existingEmail = await User.findOne({ email, _id: { $ne: id } });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already in use." });
    }

    // ✅ Check for duplicate username in other users
    const existingUsername = await User.findOne({ username, _id: { $ne: id } });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already in use." });
    }

    // ✅ Hash new password if provided
    if (password) {
      const isValidPassword = (pw) =>
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(pw);

      if (!isValidPassword(password)) {
        return res.status(400).json({
          message: "Password must be at least 8 characters and include letters & numbers.",
        });
      }

      updateFields.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User updated", user: updatedUser });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Failed to update user", error: err.message });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
};
