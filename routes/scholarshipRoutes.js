const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const {
  createScholarship,
  getAllScholarships,
  applyToScholarship,
  updateScholarship,
  deleteScholarship,
  getScholarshipApplicants, // 👈 add import
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

// Admin: Get applicants for a specific scholarship
router.get('/:id/applicants', protect, getScholarshipApplicants); // 👈 new route

module.exports = router;
