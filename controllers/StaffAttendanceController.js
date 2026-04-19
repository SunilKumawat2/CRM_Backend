const StaffAttendance = require("../models/StaffAttendance");
const AdminLogin = require("../models/Admin_Login");
// ------------------ HELPER ------------------
// Safe date parser (NO timezone bug)
const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

// ------------------ CREATE ATTENDANCE ------------------
// const createStaffAttendance = async (req, res) => {
//   try {
//     const {
//       staff,
//       date,
//       status,
//       checkInTime,
//       checkOutTime,
//       notes,
//       location,
//       deviceInfo,
//     } = req.body;

//     // ✅ validation
//     if (!staff || !date || !status) {
//       return res.status(400).json({
//         status: 400,
//         message: "Staff, date, and status are required",
//       });
//     }

//     // ✅ SAFE DATE (no UTC shift)
//     const attendanceDate = parseLocalDate(date);

//     // ❌ prevent future date
//     const today = new Date();
//     today.setHours(23, 59, 59, 999);

//     if (attendanceDate > today) {
//       return res.status(400).json({
//         status: 400,
//         message: "Attendance date cannot be in the future",
//       });
//     }

//     // ✅ duplicate check (FULL DAY RANGE)
//     const start = new Date(attendanceDate);
//     start.setHours(0, 0, 0, 0);

//     const end = new Date(attendanceDate);
//     end.setHours(23, 59, 59, 999);

//     const existing = await StaffAttendance.findOne({
//       staff,
//       date: { $gte: start, $lte: end },
//     });

//     if (existing) {
//       return res.status(409).json({
//         status: 409,
//         message: "Attendance already exists for this date",
//       });
//     }

//     // ✅ parse datetime safely
//     const checkIn = checkInTime ? new Date(checkInTime) : null;
//     const checkOut = checkOutTime ? new Date(checkOutTime) : null;

//     // ✅ calculate late + work minutes
//     let isLate = false;
//     let totalWorkMinutes = 0;

//     if (checkIn) {
//       const standardStart = new Date(attendanceDate);
//       standardStart.setHours(9, 0, 0, 0); // 9 AM
//       isLate = checkIn > standardStart;
//     }

//     if (checkIn && checkOut) {
//       totalWorkMinutes = Math.max(
//         0,
//         Math.floor((checkOut - checkIn) / 60000)
//       );
//     }

//     // ✅ create attendance
//     const attendance = await StaffAttendance.create({
//       staff,
//       date: attendanceDate,
//       status,
//       checkInTime: checkIn,
//       checkOutTime: checkOut,
//       totalWorkMinutes,
//       isLate,
//       notes,
//       location,
//       deviceInfo,
//       verifiedBy: req.adminId,
//       verifiedAt: new Date(),
//     });

//     return res.status(201).json({
//       status: 201,
//       message: "Attendance recorded successfully",
//       data: attendance,
//     });
//   } catch (err) {
//     console.error("Create Staff Attendance Error:", err);
//     return res.status(500).json({
//       status: 500,
//       message: "Server error creating staff attendance",
//     });
//   }
// };
const createStaffAttendance = async (req, res) => {
  try {
    const { staff, date, status, checkInTime, notes } = req.body;

    if (!staff || !date || !checkInTime) {
      return res.status(400).json({
        status: 400,
        message: "Staff, date and check-in time required",
      });
    }

    const attendanceDate = parseLocalDate(date);

    const start = new Date(attendanceDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(attendanceDate);
    end.setHours(23, 59, 59, 999);

    const existing = await StaffAttendance.findOne({
      staff,
      date: { $gte: start, $lte: end },
    });

    if (existing) {
      return res.status(409).json({
        status: 409,
        message: "Already checked-in for today",
      });
    }

    const checkIn = new Date(checkInTime);

    const standardStart = new Date(attendanceDate);
    standardStart.setHours(9, 0, 0, 0);

    const isLate = checkIn > standardStart;

    const attendance = await StaffAttendance.create({
      staff,
      date: attendanceDate,
      status: "present",
      checkInTime: checkIn,
      checkOutTime: null, // ❗ IMPORTANT
      totalWorkMinutes: 0,
      isLate,
      notes,
      verifiedBy: req.adminId,
      verifiedAt: new Date(),
    });

    res.status(201).json({
      status: 201,
      message: "Check-in successful",
      data: attendance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------ GET ATTENDANCE ------------------
const getStaffAttendance = async (req, res) => {
  try {
    const {
      staffId,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 50,
    } = req.query;

    const q = {};

    if (staffId) q.staff = staffId;
    if (status) q.status = status;

    // ✅ SAFE DATE FILTER
    if (startDate && endDate) {
      const start = parseLocalDate(startDate);
      start.setHours(0, 0, 0, 0);

      const end = parseLocalDate(endDate);
      end.setHours(23, 59, 59, 999);

      q.date = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [total, records] = await Promise.all([
      StaffAttendance.countDocuments(q),
      StaffAttendance.find(q)
        .populate("staff", "name email role")
        .populate("verifiedBy", "name email")
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
    ]);

    return res.status(200).json({
      status: 200,
      message: "Staff attendance records fetched successfully",
      total,
      data: records,
    });
  } catch (err) {
    console.error("Get Staff Attendance Error:", err);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching staff attendance",
    });
  }
};

// Update staff attendance record
// const updateStaffAttendance = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = req.body;

//     const record = await StaffAttendance.findById(id);
//     if (!record)
//       return res.status(404).json({ status: 404, message: "Attendance record not found" });

//     Object.assign(record, updates);
//     await record.save();

//     res.status(200).json({
//       status: 200,
//       message: "Staff attendance updated successfully",
//       data: record,
//     });
//   } catch (err) {
//     console.error("Update Staff Attendance Error:", err);
//     res.status(500).json({
//       status: 500,
//       message: "Server error updating staff attendance",
//     });
//   }
// };
const updateStaffAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkOutTime } = req.body;

    const record = await StaffAttendance.findById(id);

    if (!record) {
      return res.status(404).json({
        message: "Attendance not found",
      });
    }

    // ❌ already checked out
    if (record.checkOutTime) {
      return res.status(400).json({
        message: "Already checked-out",
      });
    }

    // ❌ no check-in
    if (!record.checkInTime) {
      return res.status(400).json({
        message: "Check-in missing",
      });
    }

    if (!checkOutTime) {
      return res.status(400).json({
        message: "Check-out time required",
      });
    }

    const checkOut = new Date(checkOutTime);

    // ❌ checkout before checkin
    if (checkOut <= record.checkInTime) {
      return res.status(400).json({
        message: "Invalid check-out time",
      });
    }

    record.checkOutTime = checkOut;

    // ✅ calculate working time
    record.totalWorkMinutes = Math.floor(
      (checkOut - record.checkInTime) / 60000
    );

    await record.save();

    res.status(200).json({
      status: 200,
      message: "Check-out successful",
      data: record,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Verify staff attendance manually (by admin)
const verifyStaffAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await StaffAttendance.findById(id);
    if (!record)
      return res.status(404).json({ status: 404, message: "Attendance record not found" });

    record.verifiedBy = req.adminId;
    record.verifiedAt = new Date();
    await record.save();

    res.status(200).json({
      status: 200,
      message: "Staff attendance verified successfully",
      data: record,
    });
  } catch (err) {
    console.error("Verify Staff Attendance Error:", err);
    res.status(500).json({
      status: 500,
      message: "Server error verifying attendance",
    });
  }
};

// Delete staff attendance record
const deleteStaffAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await StaffAttendance.findByIdAndDelete(id);
    if (!record)
      return res.status(404).json({ status: 404, message: "Attendance record not found" });

    res.status(200).json({ status: 200, message: "Staff attendance record deleted" });
  } catch (err) {
    console.error("Delete Staff Attendance Error:", err);
    res.status(500).json({
      status: 500,
      message: "Server error deleting staff attendance",
    });
  }
};

// Get monthly attendance summary
const getAttendanceSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({
        status: 400,
        message: "Month and year are required",
      });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const summary = await StaffAttendance.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$staff",
          totalPresent: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          totalAbsent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          totalLeave: { $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] } },
          totalHalfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "adminlogins",
          localField: "_id",
          foreignField: "_id",
          as: "staffInfo",
        },
      },
      { $unwind: "$staffInfo" },
      {
        $project: {
          _id: 0,
          staffId: "$staffInfo._id",
          staffName: "$staffInfo.name",
          email: "$staffInfo.email",
          totalPresent: 1,
          totalAbsent: 1,
          totalLeave: 1,
          totalHalfDay: 1,
        },
      },
    ]);

    res.status(200).json({
      status: 200,
      message: "Monthly attendance summary fetched successfully",
      data: summary,
    });
  } catch (err) {
    console.error("Get Attendance Summary Error:", err);
    res.status(500).json({
      status: 500,
      message: "Server error fetching attendance summary",
    });
  }
};

module.exports = {
  createStaffAttendance,
  getStaffAttendance,
  updateStaffAttendance,
  verifyStaffAttendance,
  deleteStaffAttendance,
  getAttendanceSummary,
};
