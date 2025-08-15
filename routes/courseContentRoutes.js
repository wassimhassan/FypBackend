// routes/courseContentRoutes.js
const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../utils/s3');

const { protect, requireRole } = require('../middleware/auth');
const isEnrolled = require('../middleware/isEnrolled');
const isOwner = require('../middleware/courseOwner');

const {
  uploadCourseContent,
  getCourseContent,
  deleteCourseContent,
  getCourseContentPublic,
} = require('../controllers/courseContentController');

const BUCKET =
  process.env.AWS_BUCKET_NAME;

if (!BUCKET) {
  throw new Error(
    "Missing S3 bucket env var. Set S3_BUCKET (or AWS_S3_BUCKET / S3_BUCKET_NAME)."
  );
}

// Multer S3 config (same constraints you had)
const upload = multer({
  storage: multerS3({
    s3,
    bucket: BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) =>
      cb(null, `courses/${req.params.id}/${Date.now()}_${file.originalname}`),
  }),
  limits: { files: 10, fileSize: 50 * 1024 * 1024 }, // up to 10 files, 50MB each
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = new Set([
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip',
      '.jpg', '.jpeg', '.png', '.webp', '.gif',
    ]);
    const allowedMimes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed',
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'application/octet-stream',
    ]);
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (allowedExtensions.has(ext) || allowedMimes.has(file.mimetype)) {
      return cb(null, true);
    }
    console.warn('[upload] Rejected file type', { mimetype: file.mimetype, name: file.originalname });
    return cb(new Error('Unsupported file type'));
  },
});

/* Create uploads (owner/admin) */
router.post(
  '/:id/content',
  protect,
  requireRole('teacher', 'admin'),
  isOwner,
  upload.any(),
  uploadCourseContent
);

/* List course content (owner/admin) */
router.get(
  '/:id/content',
  protect,
  requireRole('teacher', 'admin'),
  isOwner,
  getCourseContent
);

/* Delete a file (uploader or admin) */
router.delete(
  '/content/:contentId',
  protect,
  requireRole('teacher', 'admin'),
  deleteCourseContent
);

router.get(
  '/:id/content/public',
  protect,
  isEnrolled,
  getCourseContentPublic
);

module.exports = router;
