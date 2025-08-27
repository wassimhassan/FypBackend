// controllers/courseContentController.js
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const CourseContent = require('../models/CourseContent');
const s3 = require('../utils/s3');

/**
 * POST /api/courses/:id/content
 * Teacher/Admin (owner) uploads up to 10 files for a course.
 * Expects multer-s3 to have populated req.files.
 */

exports.uploadCourseContent = async (req, res) => {
  try {
    const files = Array.isArray(req.files) && req.files.length ? req.files : (req.file ? [req.file] : []);
    if (!files.length) {
      console.error('[uploadCourseContent] No files detected', {
        contentType: req.headers['content-type'],
        bodyKeys: Object.keys(req.body || {}),
        files: req.files,
        file: req.file
      });
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const items = await CourseContent.insertMany(
      files.map((f) => ({
        course: req.params.id,
        title: req.body.title || f.originalname,
        fileUrl: f.location, // multer-s3
        fileKey: f.key,
        mimeType: f.mimetype,
        size: f.size,
        uploadedBy: req.user.id,
      }))
    );

    res.status(201).json(items);
  } catch (err) {
    console.error('uploadCourseContent error:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
};

/**
 * GET /api/courses/:id/content
 * Teacher/Admin (owner) lists content for a course.
 */
exports.getCourseContent = async (req, res) => {
  try {
    const items = await CourseContent
      .find({ course: req.params.id })
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    console.error('getCourseContent error:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch content' });
  }
};

/**
 * DELETE /api/courses/content/:contentId
 * Teacher/Admin can delete a file they uploaded (or admin can delete any).
 */
exports.deleteCourseContent = async (req, res) => {
  try {
    const item = await CourseContent.findById(req.params.contentId);
    if (!item) return res.status(404).json({ message: 'Not found' });

    const isOwnerDoc =
      String(item.uploadedBy) === req.user.id || req.user.role === 'admin';
    if (!isOwnerDoc) return res.status(403).json({ message: 'Forbidden' });

    // Remove from S3 first
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: item.fileKey,
      })
    );

    // Then remove DB record
    await item.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error('deleteCourseContent error:', err);
    res.status(500).json({ message: err.message || 'Delete failed' });
  }
};

// Students (or owner) can list files
exports.getCourseContentPublic = async (req, res) => {
  try {
    const items = await CourseContent
      .find({ course: req.params.id })
      .sort({ createdAt: -1 })
      .select('_id title fileUrl fileKey mimeType size createdAt');
    res.json(items);
  } catch (err) {
    console.error('getCourseContentPublic error:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch content' });
  }
};
