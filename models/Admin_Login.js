// models/Admin_Login.js
const mongoose = require("mongoose");

const adminLoginSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    profileImage: {
      type: String, // You’ll store image path or URL
      default: "",
    },
  },
  { timestamps: true }
);

const AdminLogin = mongoose.model("AdminLogin", adminLoginSchema);
module.exports = AdminLogin;
