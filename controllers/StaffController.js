const Staff = require("../models/Staff");
const fs = require("fs");
const path = require("path");

// ------------------- Create Staff -------------------
const createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      department,
      shift,
      salary,

      // New Fields
      joiningDate,
      leavingDate,
      experienceYears,
      employeeCode,
      employmentType,

      // ID Proof
      idProofType,
      idProofNumber,

      // Emergency Contact
      emergencyName,
      emergencyRelation,
      emergencyPhone,

      // Address
      currentAddress,
      permanentAddress,
      city,
      state,
      pincode,

      // Previous Experience
      previousExperiences,
    } = req.body;

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
let idProofImage = "";
let documents = [];

// Profile Image
if (req.files?.profileImage?.[0]) {
  profileImage = `${req.files.profileImage[0].filename}`;
}

// ID Proof Image
if (req.files?.idProofImage?.[0]) {
  idProofImage = `${req.files.idProofImage[0].filename}`;
}

// Multiple Documents
if (req.files?.documents) {
  documents = req.files.documents.map((file) => ({
    name: file.originalname,
    file: `${file.filename}`,
  }));
}
    // Parse Previous Experience
    let parsedExperiences = [];

    if (previousExperiences) {
      parsedExperiences =
        typeof previousExperiences == "string"
          ? JSON.parse(previousExperiences)
          : previousExperiences;
    }

    const staff = await Staff.create({
      name,
      email,
      phone,
      role,
      department,
      shift,
      salary,

      joiningDate,
      leavingDate,

      employeeCode,
      employmentType,

      experienceYears,

      previousExperiences: parsedExperiences,

      // ID Proof
      idProof: {
        type: idProofType,
        number: idProofNumber,
        documentImage: idProofImage,
      },

      // Emergency Contact
      emergencyContact: {
        name: emergencyName,
        relation: emergencyRelation,
        phone: emergencyPhone,
      },

      // Address
      address: {
        currentAddress,
        permanentAddress,
        city,
        state,
        pincode,
      },

      // Documents
      documents,

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
      "name email",
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

      if (
        staff.profileImage &&
        fs.existsSync(path.join(__dirname, "..", staff.profileImage))
      ) {
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

    if (
      staff.profileImage &&
      fs.existsSync(path.join(__dirname, "..", staff.profileImage))
    ) {
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
