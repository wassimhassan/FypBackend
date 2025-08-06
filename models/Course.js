const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: String, // string to support both "free" and "$15"
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
