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
    profilePicture: {
    type: String,
    default: ""
  },
    phoneNumber: {
    type: String,
    unique: false,
    default: ""
  },
    role: {
      type   : String,
      enum   : ['student', 'teacher', 'admin'],
      default: 'student',
    },
    // fields just for password-reset
    resetToken        : String,
    resetTokenExpires : Date,
  },
  { timestamps: true }
);


module.exports = mongoose.model('User', userSchema);
