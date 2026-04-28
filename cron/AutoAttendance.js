const Staff = require("../models/Staff");
const StaffAttendance = require("../models/StaffAttendance");
const Holiday = require("../models/Holiday");
const WeeklyOff = require("../models/WeeklyOff");
const Shift = require("../models/Shift");

const runAutoAttendance = async () => {
  try {
    console.log("⏰ Running Auto Attendance (Midnight Job)...");

    // 🔥 IMPORTANT → YESTERDAY
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1); // 👈 yesterday

    targetDate.setHours(0, 0, 0, 0);

    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    // ---------------- HOLIDAY ----------------
    const holiday = await Holiday.findOne({
      date: { $gte: targetDate, $lte: end },
      isActive: true,
    });

    // ---------------- WEEKLY OFF ----------------
    const weekly = await WeeklyOff.findOne();

    const dayName = targetDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const isWeeklyOffDay =
      weekly && weekly.days.includes(dayName);

    // ---------------- STAFF ----------------
    const staffList = await Staff.find({ isActive: true });

    for (const staff of staffList) {
      const existing = await StaffAttendance.findOne({
        staff: staff._id,
        date: { $gte: targetDate, $lte: end },
      });

      const shiftData = await Shift.findOne({
        name: new RegExp(`^${staff.shift}$`, "i"),
      });

      if (!shiftData) continue;

      // ============================================
      // 🔥 CASE 1: STAFF ALREADY MARKED (WORKED)
      // ============================================
      if (existing) {
        if (holiday || isWeeklyOffDay) {
          existing.isHoliday = !!holiday;
          existing.isWeeklyOff = isWeeklyOffDay;

          existing.isExtraWork = true;
          existing.isPaid = true;

          existing.notes = holiday
            ? `Worked on Holiday (${holiday.name})`
            : "Worked on Weekly Off";

          await existing.save();
        }

        continue;
      }

      // ============================================
      // 🔥 CASE 2: HOLIDAY / WEEKLY OFF
      // ============================================
      if (holiday || isWeeklyOffDay) {
        await StaffAttendance.create({
          staff: staff._id,
          shift: shiftData._id,
          date: targetDate,

          status: holiday ? "holiday" : "weekly-off",

          isHoliday: !!holiday,
          isWeeklyOff: isWeeklyOffDay,

          isPaid: holiday ? holiday.isPaid : true,

          notes: holiday
            ? `Holiday: ${holiday.name}`
            : "Weekly Off",
        });

        continue;
      }

      // ============================================
      // 🔥 CASE 3: ABSENT
      // ============================================
      await StaffAttendance.create({
        staff: staff._id,
        shift: shiftData._id,
        date: targetDate,

        status: "absent",
        isPaid: false,

        notes: "Auto marked absent",
      });
    }

    console.log("✅ Auto Attendance Completed (Yesterday)");
  } catch (err) {
    console.error("❌ Auto Attendance Error:", err);
  }
};

module.exports = runAutoAttendance;