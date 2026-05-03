// controllers/payrollController.js

const mongoose = require("mongoose");
const Payroll = require("../models/Payroll");
const Staff = require("../models/Staff");
const StaffAttendance = require("../models/StaffAttendance");
const Leave = require("../models/Leave");
const CompanyPolicy = require("../models/CompanyPolicy");
const calculateSalary = require("../utils/SalaryCalculator");

// ---------------- DATE RANGE ----------------
const getDateRange = (month, year, type) => {
  let start, end;

  if (type === "yearly") {
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31, 23, 59, 59);
  } else {
    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 0, 23, 59, 59);
  }

  return { start, end };
};

// ---------------- GENERATE PAYROLL ----------------
const generatePayroll = async (req, res) => {
  try {
    const { staffId, month, year, type = "monthly" } = req.body;

    if (!staffId || !month || !year) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // ❌ prevent duplicate
    const exists = await Payroll.findOne({ staff: staffId, month, year });
    if (exists) {
      return res.status(400).json({ message: "Payroll already exists" });
    }

    const { start, end } = getDateRange(month, year, type);

    // ================= ATTENDANCE (SAME AS SUMMARY API) =================
    const summaryAgg = await StaffAttendance.aggregate([
      {
        $match: {
          staff: new mongoose.Types.ObjectId(staffId),
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$staff",

          present: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
          },

          halfDay: {
            $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] },
          },

          absent: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
          },

          holiday: {
            $sum: { $cond: [{ $eq: ["$status", "holiday"] }, 1, 0] },
          },

          weeklyOff: {
            $sum: { $cond: [{ $eq: ["$status", "weekly-off"] }, 1, 0] },
          },

          workedOnHoliday: {
            $sum: { $cond: ["$workedOnHoliday", 1, 0] },
          },

          extraPayDays: {
            $sum: { $cond: ["$extraPayEligible", 1, 0] },
          },

          totalWorkMinutes: { $sum: "$totalWorkMinutes" },
          overtimeMinutes: { $sum: "$overtimeMinutes" },
        },
      },
    ]);

    const data = summaryAgg[0] || {};

    // ================= LEAVE =================
    const leaveCount = await Leave.countDocuments({
      staff: staffId,
      status: "approved",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    });

    // ================= STAFF =================
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // ================= POLICY =================
    const policy =
      (await CompanyPolicy.findOne()) || {
        workingDaysPerMonth: 26,
        overtimeRatePerMinute: 1,
        pfPercentage: 0,
        esiPercentage: 0,
        allowHalfDaySalary: true,
      };

    // ================= ✅ USE COMMON SALARY FUNCTION =================
    const salary = calculateSalary(
      {
        ...data,
        leave: leaveCount,
      },
      staff,
      policy
    );

    // ================= CREATE =================
    const payroll = await Payroll.create({
      staff: staffId,
      month,
      year,

      summary: {
        ...data,
        leave: leaveCount,
      },

      salary,

      totalSalary: salary.finalSalary,
      paidAmount: 0,
      remainingAmount: salary.finalSalary,

      status: "generated",
    });

    res.json({
      success: true,
      message: "Payroll generated successfully",
      data: payroll,
    });
  } catch (err) {
    console.error("Payroll Error:", err);
    res.status(500).json({ message: "Error generating payroll" });
  }
};

// ---------------- PAY SALARY ----------------
const paySalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method = "cash", note } = req.body;

    const payroll = await Payroll.findById(id).populate("staff");

    if (!payroll) {
      return res.status(404).json({ message: "Payroll not found" });
    }

    // ❌ validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Enter valid amount" });
    }

    if (amount > payroll.remainingAmount) {
      return res.status(400).json({
        message: `Only ₹${payroll.remainingAmount} remaining`,
      });
    }

    // ✅ ADD PAYMENT ENTRY
    payroll.payments.push({
      amount,
      method,
      note,
      paidAt: new Date(),
    });

    // ✅ UPDATE TOTALS
    payroll.paidAmount += amount;
    payroll.remainingAmount =
      payroll.totalSalary - payroll.paidAmount;

    // ✅ UPDATE STATUS
    if (payroll.remainingAmount === 0) {
      payroll.status = "paid";
    } else {
      payroll.status = "partial";
    }

    await payroll.save();

    res.json({
      success: true,
      message: "Salary payment added",
      data: payroll,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment failed" });
  }
};


// ---------------- GET PAYROLL ----------------
const getPayrolls = async (req, res) => {
  try {
    const { staffId, month, year } = req.query;

    const query = {};

    if (staffId) query.staff = staffId;
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    const data = await Payroll.find(query)
      .populate("staff", "name email")
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({ message: "Fetch error" });
  }
};

// ---------------- DELETE ----------------
const deletePayroll = async (req, res) => {
  try {
    await Payroll.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Deleted",
    });
  } catch (err) {
    res.status(500).json({ message: "Delete error" });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate("staff", "name");

    if (!payroll) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({
      success: true,
      data: payroll.payments,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching payments" });
  }
};

module.exports = {
  generatePayroll,
  paySalary,
  getPayrolls,
  deletePayroll,
  getPaymentHistory
};