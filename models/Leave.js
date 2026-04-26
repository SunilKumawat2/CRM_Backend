const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
      required: true,
    },

    fromDate: {
      type: Date,
      required: true,
    },

    toDate: {
      type: Date,
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["paid", "unpaid", "sick", "casual"],
      required: true,
    },

    durationType: {
      type: String,
      enum: ["full-day", "half-day"],
      default: "full-day",
    },

    reason: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ❗ prevent overlapping leave
leaveSchema.index(
  { staff: 1, fromDate: 1, toDate: 1 },
  { unique: false }
);

module.exports = mongoose.model("Leave", leaveSchema);