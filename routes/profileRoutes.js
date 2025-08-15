const express   = require("express");
const multer    = require("multer");
const multerS3  = require("multer-s3");
const s3        = require("../utils/s3");
const { protect, requireRole } = require('../middleware/auth');

require("dotenv").config();

const {
  getProfile,
  updateProfile,
  authCheck,
  logout,
  uploadProfilePicture,
  updateProfilePicture,
  removeProfilePicture,
  getProfilePicture,
  getMe,
} = require("../controllers/profileController");

const router = express.Router();

/* ------------------------------------------------------------------ */
/*  MULTER CONFIG FOR S3                                              */
/* ------------------------------------------------------------------ */
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
    key: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

/* ------------------------------------------------------------------ */
/*  PROFILE ROUTES                                                    */
/* ------------------------------------------------------------------ */
router
  .route("/profile")
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.get("/auth-check", protect, authCheck);
router.post("/logout", logout);

/* ------------------------------------------------------------------ */
/*  PROFILE-PICTURE ROUTES                                            */
/* ------------------------------------------------------------------ */
router.post(
  "/upload-profile-picture",
  protect,
  upload.single("profilePicture"),
  uploadProfilePicture
);

router.put(
  "/update-profile-picture",
  protect,
  upload.single("profilePicture"),
  updateProfilePicture
);

router.delete("/remove-profile-picture", protect, removeProfilePicture);
router.get("/profile-picture", protect, getProfilePicture);

/* ------------------------------------------------------------------ */
/*  CURRENT-USER QUICK LOOK                                           */
/* ------------------------------------------------------------------ */
router.get("/me", protect, getMe);

module.exports = router;
