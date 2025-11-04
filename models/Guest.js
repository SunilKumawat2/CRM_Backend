// models/Guest.js
const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },

    // ✅ Preferences & Notes
    preferences: {
      roomType: { type: String, default: "" },
      bedType: { type: String, default: "" },
      smoking: { type: Boolean, default: false },
      otherRequests: { type: String, default: "" },
    },

    // ✅ Loyalty / Rewards
    loyaltyPoints: { type: Number, default: 0 },
    membershipTier: {
      type: String,
      enum: ["Standard", "Silver", "Gold", "Platinum"],
      default: "Standard",
    },

    // ✅ ID Verification & Document Upload
    idType: { type: String, default: "" }, // e.g., Passport, Driver License
    idNumber: { type: String, default: "" },
    idDocumentUrl: { type: String, default: "" }, // path to uploaded file

    // ✅ Stay History (linked to Booking model)
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
