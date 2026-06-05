const mongoose = require("mongoose");

const salarySlipSchema = new mongoose.Schema(
  {
    payroll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
      required: true,
    },

    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },

    month: Number,
    year: Number,

    employeeCode: String,
    employeeName: String,
    designation: String,

    summary: {
      present: Number,
      absent: Number,
      leave: Number,
      halfDay: Number,
      holiday: Number,
      weeklyOff: Number,
      overtimeMinutes: Number,
    },

    earnings: {
      basicSalary: Number,
      overtimePay: Number,
      holidayPay: Number,
      bonus: Number,
      otherAllowance: Number,
      grossSalary: Number,
    },

    deductions: {
      pf: Number,
      esi: Number,
      absentDeduction: Number,
      advanceDeduction: Number,
      otherDeduction: Number,
      totalDeduction: Number,
    },

    netSalary: Number,

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

salarySlipSchema.index(
  { staff: 1, month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "SalarySlip",
  salarySlipSchema
);