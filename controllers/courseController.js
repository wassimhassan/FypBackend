const Course = require('../models/Course');

// Create a course (Admin only)
const createCourse = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const newCourse = await Course.create({
      ...req.body,
      createdBy: req.user.id,             // <-- ownership
    });
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
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

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
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Course not found' });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request enrollment in a course (students only)
const enrollInCourse = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can enroll in courses' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Check if already enrolled
    if (course.enrolledStudents.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Check if already requested
    if (course.pendingStudents.includes(req.user.id)) {
      return res.status(400).json({ message: 'Enrollment request already pending approval' });
    }

    // Add to pending students for teacher approval
    course.pendingStudents.push(req.user.id);
    await course.save();

    res.json({ message: 'Enrollment request submitted successfully. Waiting for teacher approval.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEnrolledStudents = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("enrolledStudents", "-password -resetToken -resetTokenExpires");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      totalEnrolled: course.enrolledStudents.length,
      students: course.enrolledStudents,
    });
      } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Get courses the logged-in user is enrolled in
const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const courses = await Course.find({ enrolledStudents: userId })
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NEW: courses created by the logged-in teacher/admin
const getMyCreatedCourses = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Unauthorized' });

    const courses = await Course.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/courses/:id/rating
// returns { ratingAvg, ratingCount, myRating }
const getCourseRating = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select('ratingAvg ratingCount CourseReviews');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const my = course.CourseReviews.find(r => String(r.user) === String(req.user.id));
    res.json({
      ratingAvg: course.ratingAvg || 0,
      ratingCount: course.ratingCount || 0,
      myRating: my ? my.rating : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/courses/:id/rating  (students + must be enrolled)
const rateCourse = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can rate courses' });
    }
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer 1–5' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const isEnrolled = course.enrolledStudents.some(s => String(s) === String(req.user.id));
    if (!isEnrolled) {
      return res.status(403).json({ message: 'You must be enrolled to rate this course' });
    }

    const existing = course.CourseReviews.find(r => String(r.user) === String(req.user.id));
    if (existing) {
      existing.rating = rating;
      existing.updatedAt = new Date();
    } else {
      course.CourseReviews.push({
        user: req.user.id,
        rating,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // update summary
    if (typeof course.recomputeRatingStats === 'function') {
      course.recomputeRatingStats();
    } else {
      // fallback if method missing
      const n = course.CourseReviews.length;
      const sum = course.CourseReviews.reduce((s, r) => s + (r.rating || 0), 0);
      course.ratingCount = n;
      course.ratingAvg = n ? Math.round((sum / n) * 10) / 10 : 0;
    }

    await course.save();

    return res.json({
      message: 'Rating saved',
      ratingAvg: course.ratingAvg,
      ratingCount: course.ratingCount,
      myRating: rating,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/courses/:id/rating  (students + must be enrolled)
const deleteMyCourseRating = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can remove ratings' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // keep the server-side enrollment guard (defense in depth)
    const isEnrolled = course.enrolledStudents.some(s => String(s) === String(req.user.id));
    if (!isEnrolled) {
      return res.status(403).json({ message: 'You must be enrolled to modify ratings' });
    }

    const idx = course.CourseReviews.findIndex(r => String(r.user) === String(req.user.id));
    if (idx === -1) return res.status(404).json({ message: 'No rating to delete' });

    course.CourseReviews.splice(idx, 1);

    // recompute summary
    if (typeof course.recomputeRatingStats === 'function') {
      course.recomputeRatingStats();
    } else {
      const n = course.CourseReviews.length;
      const sum = course.CourseReviews.reduce((s, r) => s + (r.rating || 0), 0);
      course.ratingCount = n;
      course.ratingAvg = n ? Math.round((sum / n) * 10) / 10 : 0;
    }

    await course.save();

    return res.json({
      message: 'Rating removed',
      ratingAvg: course.ratingAvg,
      ratingCount: course.ratingCount,
      myRating: 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending enrollment requests for a course (teachers only)
const getPendingEnrollments = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers can view pending enrollments' });
    }

    const course = await Course.findById(req.params.id)
      .populate('pendingStudents', '-password -resetToken -resetTokenExpires');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the user is the course creator
    if (String(course.createdBy) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only view pending enrollments for your own courses' });
    }

    res.json({
      totalPending: course.pendingStudents.length,
      students: course.pendingStudents,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve enrollment request (teachers only)
const approveEnrollment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers can approve enrollments' });
    }

    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the user is the course creator
    if (String(course.createdBy) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only approve enrollments for your own courses' });
    }

    // Check if student is in pending list
    if (!course.pendingStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student is not in pending enrollments' });
    }

    // Check if already enrolled
    if (course.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student is already enrolled' });
    }

    // Move from pending to enrolled
    course.pendingStudents = course.pendingStudents.filter(id => String(id) !== String(studentId));
    course.enrolledStudents.push(studentId);
    await course.save();

    res.json({ message: 'Enrollment approved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject enrollment request (teachers only)
const rejectEnrollment = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers can reject enrollments' });
    }

    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the user is the course creator
    if (String(course.createdBy) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only reject enrollments for your own courses' });
    }

    // Check if student is in pending list
    if (!course.pendingStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student is not in pending enrollments' });
    }

    // Remove from pending
    course.pendingStudents = course.pendingStudents.filter(id => String(id) !== String(studentId));
    await course.save();

    res.json({ message: 'Enrollment rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get courses where user has pending enrollment requests
const getMyPendingEnrollments = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view their pending enrollments' });
    }

    const courses = await Course.find({ pendingStudents: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourseById = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  res.json(course);
};

const cancelMyPending = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can cancel pending requests' });
    }

    const result = await Course.updateOne(
      { _id: req.params.id },
      { $pull: { pendingStudents: req.user.id } }
    );

    // result.modifiedCount === 0 means there was nothing to remove (already approved/rejected or never requested)
    return res.json({
      ok: true,
      removed: result.modifiedCount > 0,
      message:
        result.modifiedCount > 0
          ? 'Pending request cancelled.'
          : 'No pending request to cancel.',
    });
  } catch (err) {
    console.error('[cancelMyPending]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getEnrolledStudents,
  getMyCourses,
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
};
