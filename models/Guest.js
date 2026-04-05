const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },

    preferences: {
      type: [String],
      default: [],
    },

    loyaltyPoints: { type: Number, default: 0 },

    membershipTier: {
      type: String,
      enum: ["Standard", "Silver", "Gold", "Platinum"],
      default: "Standard",
    },

    idType: { type: String, default: "" },
    idNumber: { type: String, default: "" },
    idDocumentUrl: { type: String, default: "" },

    // ✅ CURRENT STAY
    currentStay: {
      room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
      roomNumber: String,
      roomType: String,
      checkIn: Date,
      booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // ✅ LINK BOOKING
    },

    // ✅ STAY HISTORY
    stayHistory: [
      {
        booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
        checkIn: Date,
        checkOut: Date,
        roomNumbers: [String],
        amountPaid: Number,
      },
    ],

    // ✅ NEW FIELDS
    totalStays: { type: Number, default: 0 }, // repeat tracking
    lastStayDate: { type: Date },

    notes: { type: String, default: "" },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Guest", guestSchema);