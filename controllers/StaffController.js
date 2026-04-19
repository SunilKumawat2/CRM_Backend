const Staff = require("../models/Staff");
const fs = require("fs");
const path = require("path");

// ------------------- Create Staff -------------------
const createStaff = async (req, res) => {
  try {
    const { name, email, phone, role, department, shift, salary } = req.body;

    if (!name || !email || !phone || !role) {
      return res.status(400).json({
        status: 400,
        message: "Required fields missing",
      });
    }

    const existing = await Staff.findOne({ email });
    if (existing) {
      return res.status(400).json({
        status: 400,
        message: "Staff already exists",
      });
    }

    let profileImage = "";
    if (req.file) {
      profileImage = `/uploads/staff/${req.file.filename}`;
    }

    const staff = await Staff.create({
      name,
      email,
      phone,
      role,
      department,
      shift,
      salary,
      profileImage,
      createdBy: req.adminId,
    });

    res.status(201).json({
      status: 201,
      message: "Staff created successfully",
      data: staff,
    });
  } catch (err) {
    console.error("Create Staff Error:", err);
    res.status(500).json({ status: 500, message: "Server error" });
  }
};



// ------------------- Get All Staff -------------------
const getAllStaff = async (req, res) => {
  try {
    let { page = 1, limit = 20, search = "" } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [total, staff] = await Promise.all([
      Staff.countDocuments(query),
      Staff.find(query)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit)),
    ]);

    res.status(200).json({
      status: 200,
      message: "Staff list fetched",
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: staff,
    });
  } catch (err) {
    console.error("Get Staff Error:", err);
    res.status(500).json({ status: 500, message: "Server error" });
  }
};



// ------------------- Get Single Staff -------------------
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!staff) {
      return res.status(404).json({
        status: 404,
        message: "Staff not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: staff,
    });
  } catch (err) {
    console.error("Get Staff By ID Error:", err);
    res.status(500).json({ status: 500, message: "Server error" });
  }
};



// ------------------- Update Staff -------------------
const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        status: 404,
        message: "Staff not found",
      });
    }

    const updates = req.body;

    if (req.file) {
      const imagePath = `/uploads/staff/${req.file.filename}`;

      if (staff.profileImage && fs.existsSync(path.join(__dirname, "..", staff.profileImage))) {
        fs.unlinkSync(path.join(__dirname, "..", staff.profileImage));
      }

      updates.profileImage = imagePath;
    }

    Object.assign(staff, updates);
    await staff.save();

    res.status(200).json({
      status: 200,
      message: "Staff updated successfully",
      data: staff,
    });
  } catch (err) {
    console.error("Update Staff Error:", err);
    res.status(500).json({ status: 500, message: "Server error" });
  }
};



// ------------------- Delete Staff -------------------
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        status: 404,
        message: "Staff not found",
      });
    }

    if (staff.profileImage && fs.existsSync(path.join(__dirname, "..", staff.profileImage))) {
      fs.unlinkSync(path.join(__dirname, "..", staff.profileImage));
    }

    await Staff.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 200,
      message: "Staff deleted successfully",
    });
  } catch (err) {
    console.error("Delete Staff Error:", err);
    res.status(500).json({ status: 500, message: "Server error" });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
};