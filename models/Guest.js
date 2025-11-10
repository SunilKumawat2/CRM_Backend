const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },

    // ✅ Preferences stored as array of strings
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

    stayHistory: [
      {
        booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
        checkIn: Date,
        checkOut: Date,
        roomNumbers: [String],
        amountPaid: Number,
      },
    ],

    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Guest", guestSchema);
