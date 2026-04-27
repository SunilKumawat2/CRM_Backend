// controllers/weeklyOffController.js

const WeeklyOff = require("../models/WeeklyOff");


// ================= CREATE  WeeklyOff =================
const createWeeklyOff = async (req, res) => {
  try {
    const { days } = req.body;

    if (!days || days.length === 0) {
      return res.status(400).json({
        message: "Days required",
      });
    }

    // ❗ prevent duplicate config
    const existing = await WeeklyOff.findOne();

    if (existing) {
      return res.status(409).json({
        message: "Weekly off already exists, use update API",
      });
    }

    const weekly = await WeeklyOff.create({ days });

    res.status(201).json({
      message: "Weekly off created",
      data: weekly,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating weekly off",
    });
  }
};


// ================= GET WeeklyOff =================
const getWeeklyOff = async (req, res) => {
  try {
    const data = await WeeklyOff.findOne();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching weekly off",
    });
  }
};


// ================= UPDATE WeeklyOff =================
const updateWeeklyOff = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;

    if (!days || days.length === 0) {
      return res.status(400).json({
        message: "Days required",
      });
    }

    const updated = await WeeklyOff.findByIdAndUpdate(
      id,
      { days },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Weekly off not found",
      });
    }

    res.status(200).json({
      message: "Weekly off updated",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating weekly off",
    });
  }
};


// ================= DELETE WeeklyOff =================
const deleteWeeklyOff = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await WeeklyOff.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Weekly off not found",
      });
    }

    res.status(200).json({
      message: "Weekly off deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting weekly off",
    });
  }
};


module.exports = {
  createWeeklyOff,
  getWeeklyOff,
  updateWeeklyOff,
  deleteWeeklyOff,
};