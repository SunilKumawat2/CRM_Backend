const AdminLogin = require("../models/Admin_Login");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "SDFJHSD8723ydshf8723yhsdfYHDS8723";

// ------------------- Register Admin -------------------
const registerAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Email and password are required",
      });
    }

    const existingAdmin = await AdminLogin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        status: 400,
        message: "Admin already exists",
      });
    }

    const newAdmin = new AdminLogin({
      email,
      password,
      name: name || "",
    });

    await newAdmin.save();

    return res.status(201).json({
      status: 201,
      message: "Admin registered successfully",
      data: newAdmin,
    });
  } catch (error) {
    console.log("Register Admin Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error registering admin",
    });
  }
};

// ------------------- Login Admin -------------------
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Email and password are required",
      });
    }

    const admin = await AdminLogin.findOne({ email });
    if (!admin) {
      return res.status(400).json({
        status: 400,
        message: "Invalid email or password",
      });
    }

    if (admin.password !== password) {
      return res.status(400).json({
        status: 400,
        message: "Invalid email or password",
      });
    }

    // ✅ Create JWT token
    const token = jwt.sign({ id: admin._id }, JWT_SECRET, {
      expiresIn: "1d", // token valid for 1 day
    });

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      data: {
        admin,
        token,
      },
    });
  } catch (error) {
    console.log("Login Admin Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error logging in",
    });
  }
};

// ------------------- Get Admin Profile -------------------
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.adminId; // set by auth middleware

    const admin = await AdminLogin.findById(adminId).select("-password"); // remove password

    if (!admin) {
      return res.status(404).json({
        status: 404,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Admin profile fetched successfully",
      data: admin,
    });
  } catch (error) {
    console.error("Get Admin Profile Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching profile",
    });
  }
};

// ------------------- Update Admin Profile -------------------
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.adminId; // 🔹 use token ID
    const { name, password } = req.body;

    const admin = await AdminLogin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        status: 404,
        message: "Admin not found",
      });
    }

    if (name) admin.name = name;
    if (password) admin.password = password;

    if (req.file) {
      const imagePath = `/uploads/photos/${req.file.filename}`;
      if (admin.profileImage && fs.existsSync(path.join(__dirname, "..", admin.profileImage))) {
        fs.unlinkSync(path.join(__dirname, "..", admin.profileImage));
      }
      admin.profileImage = imagePath;
    }

    await admin.save();

    return res.status(200).json({
      status: 200,
      message: "Profile updated successfully",
      data: admin,
    });
  } catch (error) {
    console.log("Update Admin Profile Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error updating profile",
    });
  }
};


module.exports = {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
};
