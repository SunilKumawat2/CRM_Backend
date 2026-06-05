const mongoose = require("mongoose");

const staffCertificateSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },

    certificateType: {
      type: String,
      enum: [
        "experience",
        "employment",
        "joining",
        "relieving",
        "salary",
      ],
      required: true,
    },

    certificateNo: {
      type: String,
      unique: true,
    },

    issueDate: {
      type: Date,
      default: Date.now,
    },

    remarks: {
      type: String,
      default: "",
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "StaffCertificate",
  staffCertificateSchema
);