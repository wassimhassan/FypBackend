const express = require('express');
const {
  createUniversity,
  getAllUniversities,
  updateUniversity,
  deleteUniversity
} = require('../controllers/universityController');

const protect = require("../middleware/auth");

const router = express.Router();

router.post('/', protect, createUniversity);
router.get('/', getAllUniversities);
router.put('/:id', protect, updateUniversity);
router.delete('/:id', protect, deleteUniversity);

module.exports = router;
