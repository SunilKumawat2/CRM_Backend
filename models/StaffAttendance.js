const mongoose = require("mongoose");

const staffAttendanceSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["present", "absent", "leave", "half-day", "remote", "on-duty"],
      default: "present",
    },

    checkInTime: {
      type: Date,
      default: null,
    },

    checkOutTime: {
      type: Date,
      default: null,
    },

    totalWorkMinutes: {
      type: Number,
      default: 0,
    },

    isLate: {
      type: Boolean,
      default: false,
    },

    location: {
      type: String,
      default: "",
    },

    deviceInfo: {
      type: String,
      default: "",
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

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

staffAttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("StaffAttendance", staffAttendanceSchema);
