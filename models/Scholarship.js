// models/scholarship.js
const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  
  scholarship_title: {
    type: String,
    required: true,
  },
  scholarship_description: {
    type: String,
    required: true,
  },
  scholarship_requirements: {
    type: String,
    required: true,
  },
  scholarship_CreatedBy: {
    type: String, 
    required: true,
  },
  scholarship_value: {
    type: Number,
    required: true,
  },
  scholarship_type: {
    type: String,
    required: true,
  },
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Scholarship', scholarshipSchema);
