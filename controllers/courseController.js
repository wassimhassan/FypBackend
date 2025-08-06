const Course = require('../models/Course');

// Create a course (Admin only)
const createCourse = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });

    const newCourse = await Course.create(req.body);
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all courses
const getAllCourses = async (_req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a course (Admin only)
const updateCourse = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });

    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Course not found' });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a course (Admin only)
const deleteCourse = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });

    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Course not found' });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse
};
