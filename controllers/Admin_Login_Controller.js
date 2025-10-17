const AdminLogin = require("../models/Admin_Login");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// ------------------- Register Admin / Super Admin -------------------
const registerAdmin = async (req, res) => {
  try {
    const { email, password, name, role, extraFields } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 400, message: "Email and password are required" });
    }

    const existingAdmin = await AdminLogin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ status: 400, message: "This role already exists" });
    }

    const totalAdmins = await AdminLogin.countDocuments();
    let finalRole = "admin"; // default role for new admins

    // First admin becomes Super Admin
    if (totalAdmins === 0) {
      finalRole = "super_admin";
    } else {
      // Only Super Admin can create new admins
      if (!req.adminId || req.adminRole !== "super_admin") {
        return res.status(403).json({
          status: 403,
          message: "Only Super Admin can create new admins",
        });
      }

      // Super Admin can assign any custom role (cannot assign 'super_admin' manually)
      if (role && role.toLowerCase() !== "super_admin") {
        finalRole = role;
      } else {
        finalRole = "admin"; // fallback
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await AdminLogin.create({
      email,
      password: hashedPassword,
      name: name || "",
      role: finalRole,
      extraFields: extraFields || {},
    });

    return res.status(201).json({
      status: 201,
      message: `Admin created successfully with role: ${finalRole}`,
      data: newAdmin,
    });
  } catch (error) {
    console.error("Register Admin Error:", error);
    return res.status(500).json({ status: 500, message: "Server error registering admin" });
  }
};
// ------------------- Login Admin -------------------
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ status: 400, message: "Email and password required" });

    const admin = await AdminLogin.findOne({ email });
    if (!admin)
      return res.status(400).json({ status: 400, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({ status: 400, message: "Invalid email or password" });

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      data: { admin, token },
    });
  } catch (error) {
    console.error("Login Admin Error:", error);
    return res.status(500).json({ status: 500, message: "Server error logging in" });
  }
};

// ------------------- Get Admin Profile -------------------
const getAdminProfile = async (req, res) => {
  try {
    const admin = await AdminLogin.findById(req.adminId).select("-password");
    if (!admin) return res.status(404).json({ status: 404, message: "Admin not found" });

    return res.status(200).json({
      status: 200,
      message: "Admin profile fetched successfully",
      data: admin,
    });
  } catch (error) {
    console.error("Get Admin Profile Error:", error);
    return res.status(500).json({ status: 500, message: "Server error fetching profile" });
  }
};

// ------------------- Update Admin Profile -------------------
const updateAdminProfile = async (req, res) => {
  try {
    const admin = await AdminLogin.findById(req.adminId);
    if (!admin) return res.status(404).json({ status: 404, message: "Admin not found" });

    const { name, password } = req.body;
    if (name) admin.name = name;
    if (password) admin.password = await bcrypt.hash(password, 10);

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
    console.error("Update Admin Profile Error:", error);
    return res.status(500).json({ status: 500, message: "Server error updating profile" });
  }
};

// ------------------- Get All Admins (Super Admin only) -------------------
const getAllAdmins = async (req, res) => {
  try {
    if (req.adminRole !== "super_admin") {
      return res.status(403).json({
        status: 403,
        message: "Only Super Admin can view admin list",
      });
    }

    const admins = await AdminLogin.find().select("-password");

    return res.status(200).json({
      status: 200,
      message: "Admin list fetched successfully",
      data: admins,
    });
  } catch (error) {
    console.error("Get All Admins Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching admin list",
    });
  }
};

// ------------------- Delete Admin (Super Admin only) -------------------
const deleteAdmin = async (req, res) => {
  try {
    if (req.adminRole !== "super_admin") {
      return res.status(403).json({
        status: 403,
        message: "Only Super Admin can delete admins",
      });
    }

    const { id } = req.params;

    const admin = await AdminLogin.findById(id);
    if (!admin) {
      return res.status(404).json({
        status: 404,
        message: "Admin not found",
      });
    }

    // Prevent deleting another super admin
    if (admin.role === "super_admin") {
      return res.status(403).json({
        status: 403,
        message: "Cannot delete another Super Admin",
      });
    }

    await AdminLogin.findByIdAndDelete(id);

    return res.status(200).json({
      status: 200,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete Admin Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error deleting admin",
    });
  }
};

module.exports = {
   registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  getAllAdmins,
  deleteAdmin,
};
