const express = require('express');
const {
  createCareer,
  getAllCareers,
  updateCareer,
  deleteCareer
} = require('../controllers/careerController');

const protect = require("../middleware/auth");

const router = express.Router();

// Admin-only routes
router.post('/', protect, createCareer);
router.put('/:id', protect, updateCareer);
router.delete('/:id', protect, deleteCareer);

// Public
router.get('/', getAllCareers);

module.exports = router;
