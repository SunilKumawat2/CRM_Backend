// const mongoose = require("mongoose");

// const housekeepingSchema = new mongoose.Schema(
//   {
//     room: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Room",
//       required: true,
//     },
//     // Using AdminLogin model for assigned staff
//     assignedTo: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "AdminLogin", // Housekeeping staff or admin
//     },
//     scheduleDate: {
//       type: Date,
//       required: true,
//     },
//     shift: {
//       type: String,
//       enum: ["morning", "afternoon", "evening","night"],
//       default: "morning",
//     },
//     cleaningStatus: {
//       type: String,
//       enum: ["pending", "in_progress", "completed", "skipped"],
//       default: "pending",
//     },
//     roomCondition: {
//       type: String,
//       enum: ["clean", "dirty", "needs_maintenance"],
//       default: "dirty",
//     },
//     notes: String,

//     amenitiesReplaced: [
//       {
//         item: String,
//         quantity: { type: Number, default: 1 },
//       },
//     ],

//     laundryStatus: {
//       type: String,
//       enum: ["not_collected", "in_progress", "returned","completed"],
//       default: "not_collected",
//     },

//     verifiedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "AdminLogin",
//     },
//     verifiedAt: Date,

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "AdminLogin",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Housekeeping", housekeepingSchema);


const mongoose = require("mongoose");
const Room = require("./Room");

const housekeepingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    },
    scheduleDate: {
      type: Date,
      required: true,
    },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "evening","night"],
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
      enum: ["not_collected", "in_progress", "returned","completed"],
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

/* ================= AUTOMATIC ROOM STATUS SYNC ================= */
async function syncRoomStatus(doc) {
  if (!doc.room) return;

  let roomStatus = "Dirty";

  if (doc.roomCondition === "needs_maintenance") roomStatus = "In Maintenance";
  else if (doc.cleaningStatus === "completed" || doc.roomCondition === "clean") roomStatus = "Clean";

  try {
    await Room.findByIdAndUpdate(doc.room, { housekeepingStatus: roomStatus });
  } catch (err) {
    console.error("Error syncing Room housekeepingStatus:", err);
  }
}

// After save (create or update)
housekeepingSchema.post("save", async function(doc) {
  await syncRoomStatus(doc);
});

// After findOneAndUpdate (for updates using findOneAndUpdate)
housekeepingSchema.post("findOneAndUpdate", async function(doc) {
  if (doc) await syncRoomStatus(doc);
});

module.exports = mongoose.model("Housekeeping", housekeepingSchema);