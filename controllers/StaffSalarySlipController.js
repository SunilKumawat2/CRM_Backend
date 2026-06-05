const SalarySlip = require("../models/SalarySlip");
const Payroll = require("../models/Payroll");
const Staff = require("../models/Staff");

const generateSalarySlip = async (req, res) => {
  try {
    const { staffId, month, year } = req.body;

    if (!staffId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "staffId, month and year are required",
      });
    }

    // Find payroll for selected staff and month
    const payroll = await Payroll.findOne({
      staff: staffId,
      month: Number(month),
      year: Number(year),
    }).populate("staff");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found for selected month",
      });
    }

    // Check existing slip
    const existingSlip = await SalarySlip.findOne({
      staff: staffId,
      month: Number(month),
      year: Number(year),
    });

    if (existingSlip) {
      return res.status(200).json({
        success: true,
        message: "Salary slip already exists",
        data: existingSlip,
      });
    }

    const basicSalary = payroll.salary?.baseSalary || 0;
    const overtimePay = payroll.salary?.overtimePay || 0;

    const pf = payroll.salary?.pfDeduction || 0;
    const esi = payroll.salary?.esiDeduction || 0;
    const absentDeduction =
      payroll.salary?.absentDeduction || 0;

    const totalDeduction =
      pf + esi + absentDeduction;

    const slip = await SalarySlip.create({
      payroll: payroll._id,
      staff: payroll.staff._id,

      month: payroll.month,
      year: payroll.year,

      employeeCode:
        payroll.staff.employeeCode || "",

      employeeName:
        payroll.staff.name || "",

      designation:
        payroll.staff.role || "",

      summary: {
        present: payroll.summary?.present || 0,
        absent: payroll.summary?.absent || 0,
        leave: payroll.summary?.leave || 0,
        halfDay: payroll.summary?.halfDay || 0,
        holiday: payroll.summary?.holiday || 0,
        weeklyOff: payroll.summary?.weeklyOff || 0,
        overtimeMinutes:
          payroll.summary?.overtimeMinutes || 0,
      },

      earnings: {
        basicSalary,
        overtimePay,
        holidayPay: 0,
        bonus: 0,
        otherAllowance: 0,

        grossSalary:
          basicSalary +
          overtimePay,
      },

      deductions: {
        pf,
        esi,
        absentDeduction,

        advanceDeduction: 0,
        otherDeduction: 0,

        totalDeduction,
      },

      netSalary:
        payroll.salary?.finalSalary || 0,

      generatedBy: req.adminId,
    });

    res.status(201).json({
      success: true,
      message: "Salary slip generated successfully",
      data: slip,
    });
  } catch (err) {
    console.error("Generate Salary Slip Error:", err);

    res.status(500).json({
      success: false,
      message: "Error generating salary slip",
    });
  }
};

const getSalarySlip = async (req, res) => {
  try {
    const { id } = req.params;

    const slip = await SalarySlip.findById(id)
      .populate(
        "staff",
        "name employeeCode role"
      )
      .populate("payroll");

    if (!slip) {
      return res.status(404).json({
        success: false,
        message: "Salary slip not found",
      });
    }

    res.status(200).json({
      success: true,
      data: slip,
    });
  } catch (err) {
    console.error("Get Salary Slip Error:", err);

    res.status(500).json({
      success: false,
      message: "Error fetching salary slip",
    });
  }
};

  const getSalarySlipSummary = async (req, res) => {
    try {
      const { month, year } = req.query;
  
      const slips = await SalarySlip.find({
        month,
        year,
      });
  
      const summary = slips.reduce(
        (acc, item) => {
          acc.totalEmployees += 1;
          acc.totalSalary += item.netSalary;
  
          return acc;
        },
        {
          totalEmployees: 0,
          totalSalary: 0,
        }
      );
  
      res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      res.status(500).json({
        message: "Summary error",
      });
    }
  };

  const getSalarySlips = async (req, res) => {
    try {
      const { month, year, staffId } = req.query;
  
      const query = {};
  
      if (month) query.month = Number(month);
      if (year) query.year = Number(year);
      if (staffId) query.staff = staffId;
  
      const slips = await SalarySlip.find(query)
        .populate(
          "staff",
          "name employeeCode role"
        )
        .sort({
          year: -1,
          month: -1,
          createdAt: -1,
        });
  
      res.status(200).json({
        success: true,
        count: slips.length,
        data: slips,
      });
    } catch (err) {
      console.error("Get Salary Slips Error:", err);
  
      res.status(500).json({
        success: false,
        message: "Error fetching salary slips",
      });
    }
  };

  module.exports = {
    generateSalarySlip,
    getSalarySlip,
    getSalarySlipSummary,
    getSalarySlips
  };
  