const Course = require('../models/Course');

module.exports = async function isEnrolled(req, res, next) {
  const course = await Course.findById(req.params.id).select('enrolledStudents price createdBy');
  if (!course) return res.status(404).json({ message: 'Course not found' });

  const isOwner = String(course.createdBy) === req.user.id || req.user.role === 'admin';
  const enrolled = course.enrolledStudents?.some((u) => String(u) === req.user.id);

  if (!isOwner && !enrolled) {
    return res.status(403).json({ message: 'Not enrolled in this course' });
  }
  req.course = course;
  next();
};
