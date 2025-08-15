// models/CourseContent.js
const mongoose = require('mongoose');
const contentSchema = new mongoose.Schema({
  course:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title:      { type: String },
  fileUrl:    { type: String, required: true },
  fileKey:    { type: String, required: true }, // S3 key
  mimeType:   { type: String },
  size:       { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('CourseContent', contentSchema);
