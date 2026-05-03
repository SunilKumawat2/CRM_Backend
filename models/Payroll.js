// models/Payroll.js

const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },

    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    // ---------------- SUMMARY ----------------
    summary: {
      type: Object,
      default: {},
    },

    // ---------------- SALARY ----------------
    salary: {
      perDaySalary: Number,
      baseSalary: Number,
      overtimePay: Number,
      pfDeduction: Number,
      esiDeduction: Number,
      absentDeduction: Number,
      finalSalary: Number,
    },

    // ---------------- PAYMENT TRACKING ----------------
    totalSalary: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    remainingAmount: {
      type: Number,
      required: true,
    },

    payments: [
      {
        amount: {
          type: Number,
          required: true,
        },
        method: {
          type: String,
          enum: ["cash", "upi", "bank"],
          default: "cash",
        },
        note: String,
        paidAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ---------------- STATUS ----------------
    status: {
      type: String,
      enum: ["generated", "partial", "paid"],
      default: "generated",
    },
  },
  { timestamps: true }
);

// ❗ prevent duplicate payroll (IMPORTANT)
payrollSchema.index({ staff: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Payroll", payrollSchema);