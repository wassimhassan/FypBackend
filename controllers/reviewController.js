const Review = require("../models/Review");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

// ✅ Add Review
exports.addReview = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const userId = req.user.id;

  const review = await Review.create({ user: userId, text });

  const user = await User.findById(userId).select("username profilePicture");

  res.status(201).json({
    message: "Review added",
    review: {
      _id: review._id,
      text: review.text,
      createdAt: review.createdAt,
      username: user.username,
      profilePicture: user.profilePicture,
    }
  });
});

// ✅ Delete Review
exports.deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params; // review ID
  const userId = req.user.id;

  const review = await Review.findById(id);
  if (!review) return res.status(404).json({ message: "Review not found" });

  if (review.user.toString() !== userId)
    return res.status(403).json({ message: "Not authorized to delete this review" });

  await review.deleteOne();
  res.json({ message: "Review deleted successfully" });
});

// ✅ Get All Reviews (with user info)
exports.getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .sort({ createdAt: -1 })
    .populate("user", "username profilePicture");

  const formatted = reviews.map((r) => ({
    _id: r._id,
    text: r.text,
    createdAt: r.createdAt,
    username: r.user.username,
    profilePicture: r.user.profilePicture,
      user: r.user._id, // ✅ Add this line

  }));

  res.json(formatted);
});
