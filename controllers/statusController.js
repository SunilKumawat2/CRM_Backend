const StatusModal = require("../models/Status");

// Create a new status
const createStatus = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ status: 400, message: "Status name is required" });
    }

    const statusExists = await StatusModal.findOne({ name });
    if (statusExists) {
      return res.status(400).json({ status: 400, message: "Status already exists" });
    }

    const newStatus = new StatusModal({ name });
    await newStatus.save();

    return res.status(201).json({
      status: 201,
      message: "Status created successfully",
      data: newStatus,
    });
  } catch (error) {
    console.log("Create Status Error:", error);
    return res.status(500).json({ status: 500, message: "Server error creating status" });
  }
};

// Get all statuses
const getStatuses = async (req, res) => {
  try {
    const statuses = await StatusModal.find().sort({ createdAt: -1 });
    return res.status(200).json({
      status: 200,
      message: "Statuses fetched successfully",
      data: statuses,
    });
  } catch (error) {
    console.log("Get Status Error:", error);
    return res.status(500).json({ status: 500, message: "Server error fetching statuses" });
  }
};

module.exports = { createStatus, getStatuses };
