const Shift = require("../models/Shift");

// <------------ Create Shifts ---------------->
const createShift = async (req, res) => {
  try {
    const { name, startTime, endTime } = req.body;

    // ✅ validation
    if (!name || !startTime || !endTime) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // ❌ duplicate check
    const existing = await Shift.findOne({ name });

    if (existing) {
      return res.status(409).json({
        message: "Shift already exists",
      });
    }

    const shift = await Shift.create({
      name,
      startTime,
      endTime,
    });

    res.status(201).json({
      message: "Shift created successfully",
      data: shift,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error creating shift",
    });
  }
};
// <--------- Get Shifts ------------------->
const getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: shifts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching shifts",
    });
  }
};

module.exports = { getShifts,createShift };