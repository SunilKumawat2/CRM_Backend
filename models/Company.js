const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    logo: { type: String }, // store URL/path
    phone: { type: String },
    address: { type: String },
    email: { type: String },
    hrSignature: { type: String },
    stamp: { type: String },
    // HR DETAILS
    hrName: {
      type: String,
      trim: true,
      default: "",
    },

    hrDesignation: {
      type: String,
      trim: true,
      default: "HR Manager",
    },

    // OPTIONAL
    hrSignature: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);