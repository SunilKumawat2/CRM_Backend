const StaffAttendance = require("../models/StaffAttendance");
const AdminLogin = require("../models/Admin_Login");

// Create staff attendance record
const createStaffAttendance = async (req, res) => {
  try {
    const { staff, date, status, checkInTime, checkOutTime, notes } = req.body;

    if (!staff || !date || !status) {
      return res.status(400).json({
        status: 400,
        message: "Staff, date, and status are required",
      });
    }

    // Prevent duplicate attendance for same staff on same date
    const existing = await StaffAttendance.findOne({
      staff,
      date: new Date(date),
    });

    if (existing) {
      return res.status(409).json({
        status: 409,
        message: "Attendance already recorded for this staff on this date",
      });
    }

    const attendance = await StaffAttendance.create({
      staff,
      date,
      status,
      checkInTime,
      checkOutTime,
      notes,
      verifiedBy: req.adminId,
    });

    return res.status(201).json({
      status: 201,
      message: "Staff attendance created successfully",
      data: attendance,
    });
  } catch (err) {
    console.error("Create Staff Attendance Error:", err);
    res.status(500).json({
      status: 500,
      message: "Server error creating staff attendance",
    });
  }
};

// Get all staff attendance records
const getStaffAttendance = async (req, res) => {
  try {
    const { staffId, startDate, endDate, status, page = 1, limit = 50 } = req.query;
    const q = {};

    if (staffId) q.staff = staffId;
    if (status) q.status = status;
    if (startDate && endDate) {
      q.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
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

    res.status(200).json({
      status: 200,
      message: "Staff attendance records fetched successfully",
      total,
      data: records,
    });
  } catch (err) {
    console.error("Get Staff Attendance Error:", err);
    res.status(500).json({
      status: 500,
      message: "Server error fetching staff attendance",
    });
  }
};

// Update staff attendance record
const updateStaffAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const record = await StaffAttendance.findById(id);
    if (!record)
      return res.status(404).json({ status: 404, message: "Attendance record not found" });

    Object.assign(record, updates);
    await record.save();

    res.status(200).json({
      status: 200,
      message: "Staff attendance updated successfully",
      data: record,
    });
  } catch (err) {
    console.error("Update Staff Attendance Error:", err);
    res.status(500).json({
      status: 500,
      message: "Server error updating staff attendance",
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
