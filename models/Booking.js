// models/Booking.js
const mongoose = require("mongoose");

const bookedRoomSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  roomNumber: { type: String }, // denormalized snapshot
  rate: { type: Number, required: true },
  guests: { type: Number, default: 1 },
  extraInfo: { type: String, default: "" },
});

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    guestName: { type: String, required: true }, // simple guest info (can be ref to Guest model)
    guestContact: { type: String, default: "" },
    guestEmail: { type: String, default: "" },

    rooms: [bookedRoomSchema], // rooms reserved in this booking

    // primary interval (for single check-in/out) — bookings may also store per-room dates if needed
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
      default: "pending",
    },

    source: {
      type: String,
      enum: ["manual", "online", "channel_manager"],
      default: "manual",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid",
    },

    totalAmount: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },

    groupBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null }, // optional link for group bookings
    notes: { type: String, default: "" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin" },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin", default: null },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

// index for calendar queries
bookingSchema.index({ checkIn: 1, checkOut: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
