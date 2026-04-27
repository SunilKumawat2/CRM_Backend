const CompanyPolicy = require("../models/CompanyPolicy");

// 🔥 CREATE OR UPDATE POLICY (ONLY ONE)
const upsertCompanyPolicy = async (req, res) => {
    try {
      const {
        pfPercentage,
        esiPercentage,
        overtimeRatePerMinute,
        workingDaysPerMonth,
        allowHalfDaySalary,
      } = req.body;
  
      let policy = await CompanyPolicy.findOne({
        createdBy: req.adminId,
      });
  
      if (policy) {
        // UPDATE
        policy.pfPercentage = pfPercentage;
        policy.esiPercentage = esiPercentage;
        policy.overtimeRatePerMinute = overtimeRatePerMinute;
        policy.workingDaysPerMonth = workingDaysPerMonth;
        policy.allowHalfDaySalary = allowHalfDaySalary;
  
        await policy.save();
      } else {
        // CREATE
        policy = await CompanyPolicy.create({
          pfPercentage,
          esiPercentage,
          overtimeRatePerMinute,
          workingDaysPerMonth,
          allowHalfDaySalary,
          createdBy: req.adminId,
        });
      }
  
      res.json({
        success: true,
        message: "Policy saved",
        data: policy,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error saving policy" });
    }
  };

// 🔥 GET POLICY
const getCompanyPolicy = async (req, res) => {
  try {
    let policy = await CompanyPolicy.findOne();

    // fallback default (important)
    if (!policy) {
      policy = {
        pfPercentage: 12,
        esiPercentage: 0.75,
        overtimeRatePerMinute: 0.5,
        workingDaysPerMonth: 30,
        allowHalfDaySalary: true,
      };
    }

    res.json({ data: policy });
  } catch (err) {
    res.status(500).json({ message: "Error fetching policy" });
  }
};

module.exports = {
  upsertCompanyPolicy,
  getCompanyPolicy,
};