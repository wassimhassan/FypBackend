const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  field: {
    type: String,
    required: true // e.g., "Computer Science", "Data Science"
  },
  description: {
    type: String,
    required: true
  },
  salaryRange: {
    type: String, // e.g., "$40,000 - $100,000"
    required: true
  },
  skills: {
    type: [String], // e.g., ["Python", "Machine Learning"]
    required: true
  },
  industries: {
    type: [String], // e.g., ["Tech", "Finance"]
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Career', careerSchema);
