const StaffAttendance = require("../models/StaffAttendance");
const Holiday = require("../models/Holiday");
const Leave = require("../models/Leave");
const Shift = require("../models/Shift");
const Staff = require("../models/Staff");
const CompanyPolicy = require("../models/CompanyPolicy");
const WeeklyOff = require("../models/WeeklyOff");

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

    const isWeeklyOff =
      weekly && weekly.days && weekly.days.includes(dayName);

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
      const attendance = await StaffAttendance.create({
        staff,
        shift,
        date: attendanceDate,

        status: "holiday",
        isHoliday: true,
        isPaid: holiday.isPaid,

        notes: `Holiday: ${holiday.name}`,
      });

      return res.status(201).json({
        message: "Holiday marked",
        data: attendance,
      });
    }

    // ---------------- WEEKLY OFF ----------------
    if (isWeeklyOff) {
      const attendance = await StaffAttendance.create({
        staff,
        shift,
        date: attendanceDate,

        status: "weekly-off",
        isWeeklyOff: true,
        isPaid: true,

        notes: "Weekly Off",
      });

      return res.status(201).json({
        message: "Weekly off marked",
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
    const lateMinutes = Math.max(
      0,
      Math.floor((checkIn - shiftStart) / 60000)
    );

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
    if (record.status === "holiday" || record.status === "weekly-off") {
      return res.status(400).json({
        message: "No checkout required for holiday/weekly off",
      });
    }

    if (record.checkOutTime) {
      return res.status(400).json({ message: "Already checked-out" });
    }

    const checkOut = new Date(checkOutTime);

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
    const totalMinutes = Math.floor(
      (checkOut - record.checkInTime) / 60000
    );

    record.totalWorkMinutes = totalMinutes;

    // ---------------- CALCULATIONS ----------------
    let lateMinutes = 0;
    if (record.checkInTime > shiftStart) {
      lateMinutes = Math.floor(
        (record.checkInTime - shiftStart) / 60000
      );
    }

    let earlyExitMinutes = 0;
    if (checkOut < shiftEnd) {
      earlyExitMinutes = Math.floor(
        (shiftEnd - checkOut) / 60000
      );
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

  // 🔥 per day salary auto calculate
  const perDay =
    salaryDetails.perDaySalary ||
    staff.salary / (policy.workingDaysPerMonth || 30);

  // ---------------- BASE ----------------
  const presentPay = summary.present * perDay;

  const halfDayPay = policy.allowHalfDaySalary
    ? summary.halfDay * (perDay / 2)
    : 0;

  const absentDeduction = summary.absent * perDay;

  const baseSalary = presentPay + halfDayPay;

  // ---------------- OVERTIME ----------------
  const overtimeRate = policy.overtimeRatePerMinute || 0;
  const overtimePay = (summary.totalWorkMinutes || 0) * overtimeRate;

  // ---------------- PF / ESI ----------------
  const pfPercent = policy.pfPercentage || 0;
  const esiPercent = policy.esiPercentage || 0;

  const pfDeduction = (baseSalary * pfPercent) / 100;
  const esiDeduction = (baseSalary * esiPercent) / 100;

  // ---------------- EXTRA ----------------
  const allowances = salaryDetails.allowances || 0;
  const bonus = salaryDetails.bonus || 0;
  const extraDeductions = salaryDetails.deductions || 0;

  // ---------------- FINAL ----------------
  const finalSalary =
    baseSalary +
    overtimePay +
    allowances +
    bonus -
    (pfDeduction + esiDeduction + absentDeduction + extraDeductions);

  return {
    perDaySalary: Math.round(perDay),
    baseSalary: Math.round(baseSalary),
    overtimePay: Math.round(overtimePay),

    pfPercent,
    pfDeduction: Math.round(pfDeduction),

    esiPercent,
    esiDeduction: Math.round(esiDeduction),

    absentDeduction: Math.round(absentDeduction),

    bonus,
    allowances,

    finalSalary: Math.round(finalSalary),
  };
};

// ---------------- MAIN API ----------------
const getAttendanceSummary = async (req, res) => {
  try {
    const { month, year, type } = req.query;

    let start, end;

    if (type === "yearly") {
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31, 23, 59, 59);
    } else {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0, 23, 59, 59);
    }

    // ---------------- COMPANY POLICY ----------------
    const companyPolicy =
      (await CompanyPolicy.findOne()) || {
        pfPercentage: 12,
        esiPercentage: 0.75,
        overtimeRatePerMinute: 0.5,
        workingDaysPerMonth: 30,
        allowHalfDaySalary: true,
      };

    // ---------------- ATTENDANCE ----------------
    const attendance = await StaffAttendance.aggregate([
      {
        $match: {
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

          totalWorkMinutes: { $sum: "$totalWorkMinutes" },
        },
      },
    ]);

    // ---------------- LEAVES ----------------
    const leaves = await Leave.aggregate([
      {
        $match: {
          status: "approved",
          fromDate: { $lte: end },
          toDate: { $gte: start },
        },
      },
      {
        $group: {
          _id: "$staff",
          totalLeave: { $sum: 1 },
        },
      },
    ]);

    // ---------------- MAP LEAVES ----------------
    const leaveMap = {};
    leaves.forEach((l) => {
      leaveMap[l._id.toString()] = l.totalLeave;
    });

    // ---------------- BASIC SUMMARY ----------------
    const finalData = attendance.map((a) => {
      const staffId = a._id.toString();

      const totalLeave = leaveMap[staffId] || 0;

      const totalWorkingDays = a.totalDays + totalLeave;

      const attendancePercentage =
        totalWorkingDays > 0
          ? ((a.present + a.halfDay * 0.5) / totalWorkingDays) * 100
          : 0;

      const leavePercentage =
        totalWorkingDays > 0
          ? (totalLeave / totalWorkingDays) * 100
          : 0;

      return {
        staff: staffId,

        totalWorkingDays,

        present: a.present,
        halfDay: a.halfDay,
        shortLeave: a.shortLeave,
        absent: a.absent,
        leave: totalLeave,

        totalWorkMinutes: a.totalWorkMinutes,

        attendancePercentage: Number(attendancePercentage.toFixed(2)),
        leavePercentage: Number(leavePercentage.toFixed(2)),
      };
    });

    // ---------------- FETCH STAFF ----------------
    const staffIds = finalData.map((f) => f.staff);

    const staffList = await Staff.find({ _id: { $in: staffIds } });

    const staffMap = {};
    staffList.forEach((s) => {
      staffMap[s._id.toString()] = s;
    });

    // ---------------- FINAL WITH SALARY ----------------
    const finalWithSalary = finalData.map((item) => {
      const staff = staffMap[item.staff];

      if (!staff) return item;

      const salary = calculateSalary(item, staff, companyPolicy);

      return {
        ...item,
        staffDetails: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          salary: staff.salary,
        },
        salary,
      };
    });

    // ---------------- RESPONSE ----------------
    res.json({
      success: true,
      type,
      month,
      year,
      policy: companyPolicy, // 🔥 useful for frontend
      data: finalWithSalary,
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