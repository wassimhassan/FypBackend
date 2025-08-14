const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true, unique: true },
    description:  { type: String, required: true },
    price:        { type: String, required: true }, // "Free" or "$150"
    instructor:   { type: String, required: true },
    durationDays: { type: Number, required: true, min: 1 },
    level:        { type: String, enum: ['Beginner','Intermediate','Advanced'], required: true },
    category:     { type: String, required: true },

    // rating is computed later from reviews
    ratingAvg:    { type: Number, default: 0, min: 0, max: 5 },
    ratingCount:  { type: Number, default: 0, min: 0 },

    // ownership
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // relationships
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 👇 read‑only students count derived from the array
courseSchema.virtual('studentsCount').get(function () {
  return Array.isArray(this.enrolledStudents) ? this.enrolledStudents.length : 0;
});

module.exports = mongoose.model('Course', courseSchema);