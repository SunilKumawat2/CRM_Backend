const StaffAttendance = require("../models/StaffAttendance");
const Holiday = require("../models/Holiday");
const Leave = require("../models/Leave");
const Shift = require("../models/Shift");
const Staff = require("../models/Staff");
const CompanyPolicy = require("../models/CompanyPolicy");
const WeeklyOff = require("../models/WeeklyOff");
const mongoose = require("mongoose");

// ------------------ HELPER ------------------
const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

// ------------------ CREATE (CHECK-IN) ------------------
const createStaffAttendance = async (req, res) => {
  try {
    const { staff, date, shift, checkInTime, notes } = req.body;

    if (!staff || !date || !shift) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const attendanceDate = parseLocalDate(date);

    const start = new Date(attendanceDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(attendanceDate);
    end.setHours(23, 59, 59, 999);

    // ❌ Future check
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (attendanceDate > today) {
      return res.status(400).json({ message: "Future not allowed" });
    }

    // ❌ Duplicate check
    const existing = await StaffAttendance.findOne({
      staff,
      shift,
      date: { $gte: start, $lte: end },
    });

    if (existing) {
      return res.status(409).json({
        message: "Attendance already exists",
      });
    }

    // ---------------- SPECIAL DAY CHECK ----------------

    // ✅ Holiday
    const holiday = await Holiday.findOne({
      date: { $gte: start, $lte: end },
      isActive: true,
    });

    // ✅ Weekly Off
    const weekly = await WeeklyOff.findOne();

    const dayName = attendanceDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const isWeeklyOff = weekly && weekly.days && weekly.days.includes(dayName);

    // ❌ Leave (highest priority)
    const leave = await Leave.findOne({
      staff,
      status: "approved",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    });

    if (leave) {
      return res.status(400).json({
        message: "On approved leave",
      });
    }

    // ---------------- HOLIDAY ----------------
    if (holiday) {
      if (!checkInTime) {
        return res.status(400).json({
          message: "Check-in required on holiday",
        });
      }

      const checkIn = new Date(checkInTime);

      const attendance = await StaffAttendance.create({
        staff,
        shift,
        date: attendanceDate,
        checkInTime: checkIn, // ✅ IMPORTANT

        status: "holiday",
        isHoliday: true,
        isPaid: holiday.isPaid,

        notes: `Holiday: ${holiday.name} (Worked)`,
      });

      await Staff.findByIdAndUpdate(staff, {
        isActive: true,
      });

      return res.status(201).json({
        message: "Holiday check-in recorded",
        data: attendance,
      });
    }

    // ---------------- WEEKLY OFF ----------------
    if (isWeeklyOff) {
      if (!checkInTime) {
        return res.status(400).json({
          message: "Check-in required on weekly off",
        });
      }

      const checkIn = new Date(checkInTime);

      const attendance = await StaffAttendance.create({
        staff,
        shift,
        date: attendanceDate,
        checkInTime: checkIn, // ✅ IMPORTANT FIX

        status: "weekly-off",
        isWeeklyOff: true,
        isPaid: true,

        notes: "Weekly Off (Worked)",
      });

      await Staff.findByIdAndUpdate(staff, {
        isActive: true,
      });

      return res.status(201).json({
        message: "Weekly off check-in recorded",
        data: attendance,
      });
    }

    // ---------------- NORMAL WORKING DAY ----------------

    if (!checkInTime) {
      return res.status(400).json({
        message: "Check-in time required",
      });
    }

    // ✅ Shift
    const shiftData = await Shift.findById(shift);
    if (!shiftData) {
      return res.status(404).json({ message: "Shift not found" });
    }

    const checkIn = new Date(checkInTime);

    // SHIFT START
    const [h, m] = shiftData.startTime.split(":");
    const shiftStart = new Date(attendanceDate);
    shiftStart.setHours(Number(h), Number(m), 0, 0);

    // LATE CALC
    const lateMinutes = Math.max(0, Math.floor((checkIn - shiftStart) / 60000));

    const isLate = lateMinutes > 0;

    const attendance = await StaffAttendance.create({
      staff,
      shift,
      date: attendanceDate,
      checkInTime: checkIn,

      status: "present",
      isLate,
      lateMinutes,
      notes,
    });

    await Staff.findByIdAndUpdate(staff, {
      isActive: true,
    });

    res.status(201).json({
      message: "Check-in successful",
      data: attendance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// ------------------ CHECK-OUT ------------------
const updateStaffAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkOutTime } = req.body;

    const record = await StaffAttendance.findById(id).populate("shift");

    if (!record) return res.status(404).json({ message: "Not found" });

    // ❌ IMPORTANT FIX: skip holiday / weekly off
    // if (record.status === "holiday" || record.status === "weekly-off") {
    //   return res.status(400).json({
    //     message: "No checkout required for holiday/weekly off",
    //   });
    // }

    if (record.checkOutTime) {
      return res.status(400).json({ message: "Already checked-out" });
    }

    const rawCheckOut = new Date(checkOutTime);

    // 🔥 FORCE SAME DATE AS ATTENDANCE
    const checkOut = new Date(record.date);

    checkOut.setHours(
      rawCheckOut.getHours(),
      rawCheckOut.getMinutes(),
      rawCheckOut.getSeconds(),
      0,
    );

    if (checkOut <= record.checkInTime) {
      return res.status(400).json({ message: "Invalid checkout" });
    }

    record.checkOutTime = checkOut;

    // ---------------- SHIFT ----------------
    const [startH, startM] = record.shift.startTime.split(":");
    const [endH, endM] = record.shift.endTime.split(":");

    const shiftStart = new Date(record.date);
    shiftStart.setHours(Number(startH), Number(startM), 0, 0);

    const shiftEnd = new Date(record.date);
    shiftEnd.setHours(Number(endH), Number(endM), 0, 0);

    if (shiftEnd <= shiftStart) {
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }

    const shiftMinutes = Math.floor((shiftEnd - shiftStart) / 60000);

    // ---------------- WORK ----------------
    const totalMinutes = Math.floor((checkOut - record.checkInTime) / 60000);

    record.totalWorkMinutes = totalMinutes;

    // ---------------- SPECIAL DAY WORK ----------------
    const isSpecialDay =
      record.status === "holiday" || record.status === "weekly-off";

    if (isSpecialDay) {
      record.workedOnHoliday = true;
      record.extraPayEligible = true;

      // treat as present (worked)
      record.status = "present";

      // all work = overtime (optional business logic)
      record.overtimeMinutes = totalMinutes;

      await record.save();
      

      return res.status(200).json({
        message: "Worked on holiday/weekly off (extra pay)",
        data: record,
      });
    }

    // ---------------- CALCULATIONS ----------------
    let lateMinutes = 0;
    if (record.checkInTime > shiftStart) {
      lateMinutes = Math.floor((record.checkInTime - shiftStart) / 60000);
    }

    let earlyExitMinutes = 0;
    if (checkOut < shiftEnd) {
      earlyExitMinutes = Math.floor((shiftEnd - checkOut) / 60000);
    }

    const totalLossMinutes = lateMinutes + earlyExitMinutes;
    const workPercentage = totalMinutes / shiftMinutes;

    const GRACE_MINUTES = 5;

    // RESET FLAGS
    record.isHalfDay = false;
    record.isShortLeave = false;
    record.shortLeaveMinutes = 0;

    // ---------------- STATUS ----------------
    if (totalLossMinutes <= GRACE_MINUTES) {
      record.status = "present";
      record.isLate = totalLossMinutes > 0;
    } else if (workPercentage < 0.25) {
      record.status = "absent";
    } else if (workPercentage < 0.5) {
      record.status = "half-day";
      record.isHalfDay = true;
    } else {
      record.status = "present";
    }

    // ---------------- OVERTIME ----------------
    if (totalMinutes > shiftMinutes) {
      record.overtimeMinutes = totalMinutes - shiftMinutes;
    }

    await record.save();

    await Staff.findByIdAndUpdate(record.staff, {
      isActive: false,
    });

    res.status(200).json({
      message: "Check-out successful",
      data: record,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ GET ------------------
const getStaffAttendance = async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;

    const q = {};

    if (staffId) q.staff = staffId;

    if (startDate && endDate) {
      const start = parseLocalDate(startDate);
      start.setHours(0, 0, 0, 0);

      const end = parseLocalDate(endDate);
      end.setHours(23, 59, 59, 999);

      q.date = { $gte: start, $lte: end };
    }

    const records = await StaffAttendance.find(q)
      .populate("staff", "name email")
      .populate("shift", "name startTime endTime")
      .sort({ date: -1 });

    res.status(200).json({ data: records });
  } catch (err) {
    res.status(500).json({ message: "Fetch error" });
  }
};

// ------------------ DELETE ------------------
const deleteStaffAttendance = async (req, res) => {
  try {
    const record = await StaffAttendance.findByIdAndDelete(req.params.id);

    if (!record) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete error" });
  }
};

// ------------------ VERIFY ------------------
const verifyStaffAttendance = async (req, res) => {
  try {
    const record = await StaffAttendance.findById(req.params.id);

    if (!record) return res.status(404).json({ message: "Not found" });

    record.verifiedBy = req.adminId;
    record.verifiedAt = new Date();

    await record.save();

    res.json({ message: "Verified" });
  } catch (err) {
    res.status(500).json({ message: "Verify error" });
  }
};

// ---------------- SALARY FUNCTION ----------------
const calculateSalary = (summary, staff, policy) => {
  const salaryDetails = staff.salaryDetails || {};

  const perDay =
    salaryDetails.perDaySalary ||
    staff.salary / (policy.workingDaysPerMonth || 30);

  // ✅ PAYABLE DAYS ONLY
  const payableDays =
    summary.present +
    (policy.allowHalfDaySalary ? summary.halfDay * 0.5 : 0) +
    (summary.leave || 0);

  const baseSalary = payableDays * perDay;

  // ✅ OVERTIME (FIXED)
  const overtimeRate = policy.overtimeRatePerMinute || 0;
  const overtimePay = (summary.overtimeMinutes || 0) * overtimeRate;

  // PF / ESI
  const pfPercent = policy.pfPercentage || 0;
  const esiPercent = policy.esiPercentage || 0;

  const pfDeduction = (baseSalary * pfPercent) / 100;
  const esiDeduction = (baseSalary * esiPercent) / 100;

  // EXTRA
  const allowances = salaryDetails.allowances || 0;
  const bonus = salaryDetails.bonus || 0;
  const extraDeductions = salaryDetails.deductions || 0;

  // FINAL
  const finalSalary =
    baseSalary +
    overtimePay +
    allowances +
    bonus -
    (pfDeduction + esiDeduction + extraDeductions);

  return {
    perDaySalary: Math.round(perDay),
    baseSalary: Math.round(baseSalary),
    overtimePay: Math.round(overtimePay),

    pfPercent,
    pfDeduction: Math.round(pfDeduction),

    esiPercent,
    esiDeduction: Math.round(esiDeduction),

    absentDeduction: 0, // ❌ removed confusion

    leavePaid: Math.round((summary.leave || 0) * perDay),

    bonus,
    allowances,

    finalSalary: Math.round(finalSalary),
  };
};

const getAttendanceSummary = async (req, res) => {
  try {
    const { staffId, month, year, type } = req.query;

    if (!staffId) {
      return res.status(400).json({ message: "staffId required" });
    }

    let start, end;

    if (type === "yearly") {
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31, 23, 59, 59);
    } else {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0, 23, 59, 59);
    }

    // ✅ FILTER BY STAFF
    const summary = await StaffAttendance.aggregate([
      {
        $match: {
          staff: new mongoose.Types.ObjectId(staffId),
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$staff",

          totalDays: { $sum: 1 },

          present: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
          },

          halfDay: {
            $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] },
          },

          shortLeave: {
            $sum: { $cond: [{ $eq: ["$status", "short-leave"] }, 1, 0] },
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

    if (!summary.length) {
      return res.json({
        success: true,
        data: {},
      });
    }
    // ---------------- AFTER AGGREGATION ----------------
    const data = summary[0];

    // ---------------- LEAVE ----------------
    const leaveCount = await Leave.countDocuments({
      staff: staffId,
      status: "approved",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    });

    // ✅ TOTAL DAYS IN MONTH
    const totalDaysInMonth =
      type === "yearly" ? 365 : new Date(year, month, 0).getDate();

    // ✅ RECORDED DAYS (present + half + absent etc.)
    const recordedDays = data.totalDays;

    // ✅ AUTO ABSENT CALCULATION (🔥 FIX)
    const autoAbsent = Math.max(0, totalDaysInMonth - recordedDays);

    // ✅ FINAL ABSENT
    const finalAbsent = data.absent + autoAbsent;

    // ✅ TOTAL WORKING DAYS
    const totalWorkingDays = totalDaysInMonth;

    // ✅ ATTENDANCE %
    const attendancePercentage =
      totalWorkingDays > 0
        ? ((data.present + data.halfDay * 0.5) / totalWorkingDays) * 100
        : 0;

    // ---------------- STAFF ----------------
    const staff = await Staff.findById(staffId);

    // ---------------- POLICY ----------------
    const policy = (await CompanyPolicy.findOne()) || {
      workingDaysPerMonth: 26,
      overtimeRatePerMinute: 1,
      pfPercentage: 0,
      esiPercentage: 0,
      allowHalfDaySalary: true,
    };

    // ---------------- SALARY ----------------
    const salary = calculateSalary(
      {
        ...data,
        leave: leaveCount,
      },
      staff,
      policy,
    );

    res.json({
      success: true,
      data: {
        staff: staffId,

        totalWorkingDays,

        present: data.present,
        halfDay: data.halfDay,
        shortLeave: data.shortLeave,
        absent: data.absent,
        leave: leaveCount,

        holiday: data.holiday,
        weeklyOff: data.weeklyOff,
        workedOnHoliday: data.workedOnHoliday,
        extraPayDays: data.extraPayDays,

        totalWorkMinutes: data.totalWorkMinutes,
        overtimeMinutes: data.overtimeMinutes,

        attendancePercentage: Number(attendancePercentage.toFixed(2)),

        staffDetails: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          salary: staff.salary,
        },

        salary,
      },
    });
  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({ message: "Summary error" });
  }
};

module.exports = {
  createStaffAttendance,
  updateStaffAttendance,
  getStaffAttendance,
  deleteStaffAttendance,
  verifyStaffAttendance,
  getAttendanceSummary,
};
