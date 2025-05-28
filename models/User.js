const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique : true,
      trim   : true,
    },
    email: {
      type   : String,
      required: true,
      unique : true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,        // at least 8 chars incl. letters & numbers
    },
    role: {
      type   : String,
      enum   : ['student', 'admin'],
      default: 'student',
    },
    // fields just for password-reset
    resetToken        : String,
    resetTokenExpires : Date,
  },
  { timestamps: true }
);

/* ----- helpers ----- */
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
