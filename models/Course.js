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
    
    // course reviews/ratings
    CourseReviews: [{
      user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      rating:  { type: Number, required: true, min: 1, max: 5 },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }],
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

// helper to recompute avg/count
courseSchema.methods.recomputeRatingStats = function () {
  const count = this.CourseReviews.length || 0;
  const avg =
    count === 0
      ? 0
      : this.CourseReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count;

  this.ratingCount = count;
  this.ratingAvg = Math.round(avg * 10) / 10; // 1-decimal
};

module.exports = mongoose.model('Course', courseSchema);