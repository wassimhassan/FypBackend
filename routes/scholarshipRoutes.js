const express = require('express');
const protect   = require("../middleware/auth");
const {
  createScholarship,
  getAllScholarships,
  applyToScholarship,
  updateScholarship,
  deleteScholarship,
} = require('../controllers/scholarshipController');



const router = express.Router();

// Admin: Create
router.post('/', protect, createScholarship);

// Public: Get all
router.get('/', getAllScholarships);

// Student: Apply
router.post('/:id/apply', protect, applyToScholarship);

// Admin: Update
router.put('/:id', protect, updateScholarship);

// Admin: Delete
router.delete('/:id', protect, deleteScholarship);

module.exports = router;

