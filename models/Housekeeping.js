const mongoose = require("mongoose");

const housekeepingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    // Using AdminLogin model for assigned staff
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin", // Housekeeping staff or admin
    },
    scheduleDate: {
      type: Date,
      required: true,
    },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      default: "morning",
    },
    cleaningStatus: {
      type: String,
      enum: ["pending", "in_progress", "completed", "skipped"],
      default: "pending",
    },
    roomCondition: {
      type: String,
      enum: ["clean", "dirty", "needs_maintenance"],
      default: "dirty",
    },
    notes: String,

    amenitiesReplaced: [
      {
        item: String,
        quantity: { type: Number, default: 1 },
      },
    ],

    laundryStatus: {
      type: String,
      enum: ["not_collected", "in_progress", "returned"],
      default: "not_collected",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    },
    verifiedAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Housekeeping", housekeepingSchema);
