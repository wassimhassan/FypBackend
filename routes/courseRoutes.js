const express = require('express');
const {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getMyCourses,
  getEnrolledStudents
  
} = require('../controllers/courseController');

const protect = require("../middleware/auth");

const router = express.Router();

router.post('/', protect, createCourse);
router.get('/', getAllCourses);
router.put('/:id', protect, updateCourse);
router.delete('/:id', protect, deleteCourse);
router.post('/:id/enroll', protect, enrollInCourse);
router.get('/my', protect, getMyCourses);
router.get('/:id/enrolled', protect, getEnrolledStudents); // ✅ New route

module.exports = router;
