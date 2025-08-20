const express = require('express');
const {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getMyCourses,
  getEnrolledStudents,
  removeEnrolledStudent,
  getMyCreatedCourses,
  getCourseRating,
  rateCourse,
  deleteMyCourseRating,
  getCourseById,
  getPendingEnrollments,
  cancelMyPending,
  approveEnrollment,
  rejectEnrollment,
  getMyPendingEnrollments,
} = require('../controllers/courseController');

const { protect, requireRole } = require('../middleware/auth');
const isOwner = require('../middleware/courseOwner');


const router = express.Router();

router.post('/', protect, createCourse);
router.get('/', getAllCourses);
router.put('/:id', protect, updateCourse);
router.delete('/:id', protect, deleteCourse);
router.post('/:id/enroll', protect, enrollInCourse);
router.get('/my', protect, getMyCourses);
router.get('/:id/enrolled', protect, isOwner, getEnrolledStudents); 
router.delete('/:id/enrolled/:studentId', protect, isOwner, removeEnrolledStudent);
router.get('/mine-created', protect, getMyCreatedCourses); 
router.get('/:id/rating', protect, getCourseRating);
// if you prefer middleware: requireRole('student'), keep it; otherwise rely on controller checks
router.post('/:id/rating', protect /*, requireRole('student')*/, rateCourse);
router.delete('/:id/rating', protect, deleteMyCourseRating);

// Enrollment management routes
router.get('/my/pending', protect, getMyPendingEnrollments);
router.delete('/:id/pending', protect, cancelMyPending);
router.get('/:id', protect, getCourseById);
router.get('/:id/pending', protect, isOwner, getPendingEnrollments);
router.post('/:id/approve', protect, isOwner, approveEnrollment);
router.post('/:id/reject', protect, isOwner, rejectEnrollment);

module.exports = router;
