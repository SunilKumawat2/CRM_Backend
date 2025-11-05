const Housekeeping = require("../models/Housekeeping");
const Room = require("../models/Room");

// Create housekeeping task
const createHousekeepingTask = async (req, res) => {
  try {
    const {
      room,
      assignedTo,
      scheduleDate,
      shift,
      notes,
      amenitiesReplaced,
      laundryStatus,
    } = req.body;

    if (!room || !scheduleDate) {
      return res.status(400).json({
        status: 400,
        message: "Room and scheduleDate are required",
      });
    }

    const task = await Housekeeping.create({
      room,
      assignedTo,
      scheduleDate,
      shift,
      notes,
      amenitiesReplaced,
      laundryStatus,
      createdBy: req.adminId,
    });

    return res.status(201).json({
      status: 201,
      message: "Housekeeping task created successfully",
      data: task,
    });
  } catch (err) {
    console.error("Create Housekeeping Error:", err);
    res.status(500).json({ status: 500, message: "Server error creating housekeeping task" });
  }
};

// Get housekeeping tasks
const getHousekeepingTasks = async (req, res) => {
  try {
    const { date, status, assignedTo, page = 1, limit = 50 } = req.query;
    const q = {};

    if (date) q.scheduleDate = { $eq: new Date(date) };
    if (status) q.cleaningStatus = status;
    if (assignedTo) q.assignedTo = assignedTo;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [total, tasks] = await Promise.all([
      Housekeeping.countDocuments(q),
      Housekeeping.find(q)
        .populate("room", "roomNumber roomType housekeepingStatus")
        .populate("assignedTo", "name email role")
        .populate("verifiedBy", "name email")
        .sort({ scheduleDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
    ]);

    res.status(200).json({
      status: 200,
      message: "Housekeeping tasks fetched successfully",
      total,
      data: tasks,
    });
  } catch (err) {
    console.error("Get Housekeeping Error:", err);
    res.status(500).json({ status: 500, message: "Server error fetching housekeeping tasks" });
  }
};

// Update housekeeping task
const updateHousekeepingTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Housekeeping.findById(id);
    if (!task) return res.status(404).json({ status: 404, message: "Task not found" });

    Object.assign(task, updates);
    await task.save();

    // Update related room if needed
    if (updates.roomCondition) {
      await Room.findByIdAndUpdate(task.room, {
        housekeepingStatus: updates.roomCondition,
      });
    }

    res.status(200).json({
      status: 200,
      message: "Housekeeping task updated successfully",
      data: task,
    });
  } catch (err) {
    console.error("Update Housekeeping Error:", err);
    res.status(500).json({ status: 500, message: "Server error updating task" });
  }
};

// Verify cleaning completion
const verifyCleaning = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Housekeeping.findById(id);
    if (!task) return res.status(404).json({ status: 404, message: "Task not found" });

    task.cleaningStatus = "completed";
    task.roomCondition = "clean";
    task.verifiedBy = req.adminId;
    task.verifiedAt = new Date();
    await task.save();

    await Room.findByIdAndUpdate(task.room, { housekeepingStatus: "Clean", isAvailable: true });

    res.status(200).json({
      status: 200,
      message: "Cleaning verified successfully",
      data: task,
    });
  } catch (err) {
    console.error("Verify Cleaning Error:", err);
    res.status(500).json({ status: 500, message: "Server error verifying cleaning" });
  }
};

// Delete housekeeping task
const deleteHousekeepingTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Housekeeping.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ status: 404, message: "Task not found" });

    res.status(200).json({ status: 200, message: "Housekeeping task deleted" });
  } catch (err) {
    console.error("Delete Housekeeping Error:", err);
    res.status(500).json({ status: 500, message: "Server error deleting task" });
  }
};

module.exports = {
  createHousekeepingTask,
  getHousekeepingTasks,
  updateHousekeepingTask,
  verifyCleaning,
  deleteHousekeepingTask,
};
