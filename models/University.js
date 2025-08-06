const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  rank: {
    type: String,
    required: true // e.g. "#1 Lebanon"
  },
  acceptanceRate: {
    type: Number,
    required: true // percentage
  },
  numberOfStudents: {
    type: Number,
    required: true
  },
  tuition: {
    type: Number,
    required: true // annual tuition in USD
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('University', universitySchema);
