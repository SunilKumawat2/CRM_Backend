const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: { type: String, required: true },

    role: {
      type: String,
      enum: ["housekeeping", "reception", "manager", "maintenance"],
      required: true,
    },

    department: {
      type: String,
      enum: ["front_office", "housekeeping", "maintenance"],
      default: "housekeeping",
    },

    shift: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
      default: "morning",
    },

    salary: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },

    profileImage: { type: String, default: "" },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);