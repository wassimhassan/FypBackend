const asyncHandler          = require("express-async-handler");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const User                  = require("../models/User");
const s3                    = require("../utils/s3");

require("dotenv").config();

const DefaultAvatar =
  "https://fekra.s3.eu-north-1.amazonaws.com/default.png";

/* ------------------------------------------------------------------ */
/*  BASIC PROFILE ACTIONS                                             */
/* ------------------------------------------------------------------ */
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.status(200).json(user);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { username, email, phoneNumber } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found." });

  if (username)    user.username    = username;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (email)       user.email       = email;

  await user.save();
  res.status(200).json({ message: "Profile updated successfully", user });
});

exports.authCheck = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.status(200).json({ message: "Authenticated", user });
});

exports.logout = asyncHandler(async (_req, res) => {
  res
    .status(200)
    .json({ message: "Logged out successfully. Remove token from frontend storage." });
});

/* ------------------------------------------------------------------ */
/*  PROFILE-PICTURE ACTIONS                                           */
/* ------------------------------------------------------------------ */
exports.uploadProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePicture = req.file.location;            // S3 URL
    await user.save();

    res
      .status(200)
      .json({ message: "Profile picture uploaded", profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePicture = req.file.location;
    await user.save();

    res
      .status(200)
      .json({ message: "Profile picture updated", profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.removeProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    /* -------- 1. Delete the old object if it isn’t the default ---------- */
    if (user.profilePicture && user.profilePicture !== DefaultAvatar) {
      const key = decodeURIComponent(new URL(user.profilePicture).pathname.slice(1));
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        })
      ); // S3 returns 204 even for a bad key
    }

    /* -------- 2. Point the user back to the default picture ------------- */
    user.profilePicture = DefaultAvatar;
    await user.save();

    res
      .status(200)
      .json({ message: "Profile picture removed", profilePicture: user.profilePicture });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ profilePicture: user.profilePicture });
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ------------------------------------------------------------------ */
/*  CURRENT-USER QUICK LOOK                                           */
/* ------------------------------------------------------------------ */
exports.getMe = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user info:", err.message);
    res.status(500).json({ error: "Server error while fetching user info" });
  }
});
