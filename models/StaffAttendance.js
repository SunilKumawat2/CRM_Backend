// models/StaffAttendance.js
const mongoose = require("mongoose");

const staffAttendanceSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin", // or "Staff" if you later have a separate staff model
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave", "half-day"],
      default: "present",
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance entry for same staff & date
staffAttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("StaffAttendance", staffAttendanceSchema);
