// models/Review.js

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // 🔗 Reference to User model
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
        rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
