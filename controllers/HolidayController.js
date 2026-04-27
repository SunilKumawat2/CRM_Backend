// controllers/holidayController.js

const Holiday = require("../models/Holiday");


// ================= CREATE Holiday =================
const createHoliday = async (req, res) => {
  try {
    const { name, date, type, isPaid } = req.body;

    if (!name || !date) {
      return res.status(400).json({
        message: "Name and date required",
      });
    }

    // ✅ normalize date
    const holidayDate = new Date(date);
    holidayDate.setHours(0, 0, 0, 0);

    const existing = await Holiday.findOne({ date: holidayDate });

    if (existing) {
      return res.status(409).json({
        message: "Holiday already exists on this date",
      });
    }

    const holiday = await Holiday.create({
      name,
      date: holidayDate,
      type,
      isPaid,
    });

    res.status(201).json({
      message: "Holiday created",
      data: holiday,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating holiday",
    });
  }
};


// ================= GET ALL Holiday =================
const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: holidays,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching holidays",
    });
  }
};


// ================= GET SINGLE Holiday =================
const getHolidayById = async (req, res) => {
  try {
    const { id } = req.params;

    const holiday = await Holiday.findById(id);

    if (!holiday) {
      return res.status(404).json({
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      data: holiday,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching holiday",
    });
  }
};


// ================= UPDATE Holiday =================
const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, type, isPaid, isActive } = req.body;

    let updateData = { name, type, isPaid, isActive };

    // ✅ agar date update ho rahi h
    if (date) {
      const holidayDate = new Date(date);
      holidayDate.setHours(0, 0, 0, 0);

      // duplicate check
      const existing = await Holiday.findOne({
        date: holidayDate,
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(409).json({
          message: "Another holiday already exists on this date",
        });
      }

      updateData.date = holidayDate;
    }

    const updated = await Holiday.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      message: "Holiday updated",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating holiday",
    });
  }
};


// ================= DELETE Holiday =================
const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Holiday.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      message: "Holiday deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: "Delete failed",
    });
  }
};


module.exports = {
  createHoliday,
  getHolidays,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
};