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
        "employment",
        "salary",
        "experience",
        "joining",
        "relieving",
        "promotion",
        "internship",
        "noc",
        "character",
        "appreciation",
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

    remarks: String,

    // Dynamic Certificate Data
    certificateData: {
      salary: Number,

      joiningDate: Date,

      relievingDate: Date,

      promotedTo: String,

      promotionDate: Date,

      internshipStartDate: Date,

      internshipEndDate: Date,

      internshipDepartment: String,

      experienceYears: Number,

      reason: String,

      customMessage: String,
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