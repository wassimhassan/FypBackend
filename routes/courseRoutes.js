const express = require('express');
const {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');

const protect = require("../middleware/auth");

const router = express.Router();

router.post('/', protect, createCourse);
router.get('/', getAllCourses);
router.put('/:id', protect, updateCourse);
router.delete('/:id', protect, deleteCourse);

module.exports = router;
