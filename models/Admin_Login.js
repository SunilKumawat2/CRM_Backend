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
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "super_admin", // first admin will be Super Admin
    },
    extraFields: {
      type: mongoose.Schema.Types.Mixed, // optional additional info
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminLogin", adminLoginSchema);
