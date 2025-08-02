const express = require("express");
const router = express.Router();
const { addReview, deleteReview, getAllReviews } = require("../controllers/reviewController");
const protect = require("../middleware/auth");

// POST /api/reviews
router.post("/", protect, addReview);

// DELETE /api/reviews/:id
router.delete("/:id", protect, deleteReview);

// GET /api/reviews
router.get("/", getAllReviews);

module.exports = router;