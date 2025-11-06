const AdminLogin = require("../models/Admin_Login");
const Role = require("../models/Role");
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
      return res.status(400).json({ status: 400, message: "Admin already exists" });
    }

    const totalAdmins = await AdminLogin.countDocuments();

    let newAdminData = {
      email,
      name,
      password: await bcrypt.hash(password, 10),
      extraFields,
    };

    if (totalAdmins === 0) {
      // First admin is always Super Admin
      newAdminData.isSuperAdmin = true;
    } else {
      if (!req.isSuperAdmin) {
        return res.status(403).json({ status: 403, message: "Only Super Admin can create admins" });
      }

      // Assign role if provided
      if (role) {
        const foundRole = await Role.findById(role);
        if (!foundRole) return res.status(404).json({ status: 404, message: "Role not found" });
        newAdminData.role = foundRole._id;
      }
    }

    const newAdmin = await AdminLogin.create(newAdminData);

    // Populate role for response
    await newAdmin.populate("role", "name description permissions");

    return res.status(201).json({ status: 201, message: "Admin created successfully", data: newAdmin, });
  } catch (err) {
    console.error("Register Admin Error:", err);
    return res.status(500).json({ status: 500, message: "Server error" });
  }
};


// ------------------- Login Admin -------------------
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await AdminLogin.findOne({ email }).populate("role");
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, isSuperAdmin: admin.isSuperAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          isSuperAdmin: admin.isSuperAdmin,
          role: admin.role?.name || null,
          permissions: admin.role?.permissions || [],
        },
        token,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Get Admin Profile -------------------
const getAdminProfile = async (req, res) => {
  try {
    const admin = await AdminLogin.findById(req.adminId).select("-password").populate("role");
    if (!admin) return res.status(404).json({ status: 404, message: "Admin not found" });

    return res.status(200).json({ status: 200, message: "Admin profile fetched successfully", data: admin, });
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
    if (!req.isSuperAdmin) return res.status(403).json({ status: 403, message: "Only Super Admin can view admin list" });

    const admins = await AdminLogin.find().select("-password").populate({
      path: "role",
      select: "name description permissions",
    });

    const formattedAdmins = admins.map((admin) => ({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      isSuperAdmin: admin.isSuperAdmin,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      role: admin.role
        ? {
          name: admin.role.name,
          description: admin.role.description,
          permissions: admin.role.permissions,
        }
        : null,
    }));

    return res.status(200).json({
      status: 200,
      message: "Admin list fetched successfully",
      data: formattedAdmins,
    });
  } catch (error) {
    console.error("Get All Admins Error:", error);
    return res.status(500).json({ status: 500, message: "Server error fetching admin list" });
  }
};

// ------------------- Delete Admin (Super Admin only) -------------------
const deleteAdmin = async (req, res) => {
  try {
    if (!req.isSuperAdmin) {
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

    if (admin.isSuperAdmin) {
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
