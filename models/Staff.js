const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
  companyName: { type: String, trim: true },
  role: { type: String, trim: true },
  years: { type: Number, default: 0 },
  description: { type: String, trim: true },
});

const idProofSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["aadhar", "pan", "passport", "driving_license", "voter_id"],
  },
  number: { type: String, trim: true },
  documentImage: { type: String, default: "" },
});

const staffSchema = new mongoose.Schema(
  {
    // Basic Details
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: { type: String, required: true },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    dateOfBirth: {
      type: Date,
    },

    // Staff Role
    role: {
      type: String,
      enum: ["housekeeping", "reception", "manager", "maintenance"],
      required: true,
    },

    department: {
      type: String,
      enum: ["front_office", "housekeeping", "maintenance"],
      default: "housekeeping",
    },

    shift: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
      default: "morning",
    },

    // Employment Details
    joiningDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    leavingDate: {
      type: Date,
      default: null,
    },

    employeeCode: {
      type: String,
      unique: true,
      trim: true,
    },

    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "temporary"],
      default: "full_time",
    },

    experienceYears: {
      type: Number,
      default: 0,
    },

    previousExperiences: [experienceSchema],

    // Salary
    salary: { type: Number, default: 0 },

    salaryDetails: {
      basic: Number,
      hra: Number,
      allowances: Number,
      pf: Number,
      esi: Number,
      bonus: Number,
      deductions: Number,
      perDaySalary: Number,
    },

    // ID Proof
    idProof: idProofSchema,

    // Address
    address: {
      currentAddress: { type: String, trim: true },
      permanentAddress: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },

    // Emergency Contact
    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },

    // Documents
    documents: [
      {
        name: String,
        file: String,
      },
    ],

    // Profile
    profileImage: { type: String, default: "" },

    isActive: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);