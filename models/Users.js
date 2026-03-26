const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
    },

    alternative_number: { type: String, default: "" },
    address: { type: String, default: "" },
    pin_code: { type: String, default: "" },
    bio: { type: String, default: "" },

    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },

    profileImage: { type: String, default: "" },

    isVerified: { type: Boolean, default: false },

    // ✅ NEW FIELDS
    isBlocked: { type: Boolean, default: false },
    blockedAt: { type: Date, default: null },
    blockedReason: { type: String, default: "" },

    extraFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);