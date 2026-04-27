const mongoose = require("mongoose");

const companyPolicySchema = new mongoose.Schema(
  {
    // 🔥 DEDUCTIONS
    pfPercentage: { type: Number, default: 12 }, // PF %
    esiPercentage: { type: Number, default: 0.75 }, // ESI %

    // 🔥 WORK RULES
    overtimeRatePerMinute: { type: Number, default: 0.5 },

    workingDaysPerMonth: { type: Number, default: 30 },

    allowHalfDaySalary: { type: Boolean, default: true },

    // 🔥 OPTIONAL SETTINGS
    latePenaltyPerMinute: { type: Number, default: 0 }, // optional future use
    bonusType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },

    // 🔐 ADMIN LINK
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanyPolicy", companyPolicySchema);