const Course = require('../models/Course');
module.exports = async function isOwner(req, res, next) {
  const course = await Course.findById(req.params.id).select('createdBy');
  if (!course) return res.status(404).json({ message: 'Course not found' });
  if (String(course.createdBy) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};
