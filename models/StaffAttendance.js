const mongoose = require("mongoose");

const staffAttendanceSchema = new mongoose.Schema(
  {
    // 👤 Staff
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
      required: true,
    },

    // 📅 Date
    date: {
      type: Date,
      required: true,
    },

    // 🕐 SHIFT
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },

    // 📌 STATUS (UPDATED 🔥)
    status: {
      type: String,
      enum: [
        "present",
        "absent",
        "leave",
        "half-day",
        "short-leave",
        "remote",
        "on-duty",
        "holiday",     // ✅ ADD
        "weekly-off"
      ],
      default: "present",
    },

    // ⏰ CHECK-IN / OUT
    checkInTime: {
      type: Date,
      default: null,
    },

    checkOutTime: {
      type: Date,
      default: null,
    },

    // ⏱ WORK DATA
    totalWorkMinutes: {
      type: Number,
      default: 0,
    },

    overtimeMinutes: {
      type: Number,
      default: 0,
    },

    // ⏱ LATE INFO (IMPORTANT 🔥)
    isLate: {
      type: Boolean,
      default: false,
    },

    lateMinutes: {
      type: Number,
      default: 0,
    },

    // 🟡 SHORT LEAVE TRACK
    shortLeaveMinutes: {
      type: Number,
      default: 0,
    },

    // 📊 FLAGS (FASTER QUERY)
    isHalfDay: {
      type: Boolean,
      default: false,
    },

    isShortLeave: {
      type: Boolean,
      default: false,
    },

    // 🌍 EXTRA INFO
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

    // 🏖️ SYSTEM FLAGS
    isHoliday: {
      type: Boolean,
      default: false,
    },

    isOnLeave: {
      type: Boolean,
      default: false,
    },

    isWeeklyOff: {
      type: Boolean,
      default: false,
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    // 🔥 NEW (IMPORTANT)
    workedOnHoliday: {
      type: Boolean,
      default: false,
    },

    extraPayEligible: {
      type: Boolean,
      default: false,
    },

    // ✅ VERIFICATION
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

//
// 🔥 UNIQUE INDEX (VERY IMPORTANT)
//
staffAttendanceSchema.index(
  { staff: 1, date: 1, shift: 1 },
  { unique: true }
);

//
// ⚡ QUICK QUERY INDEXES (PERFORMANCE BOOST)
//
staffAttendanceSchema.index({ staff: 1 });
staffAttendanceSchema.index({ date: 1 });
staffAttendanceSchema.index({ status: 1 });

module.exports = mongoose.model("StaffAttendance", staffAttendanceSchema);