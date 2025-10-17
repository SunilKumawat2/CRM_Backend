const Role = require("../models/Role");

// ---------------- Create Role (Super Admin only) ----------------
const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ status: 400, message: "Role name is required" });
    }

    // Ensure only super admin can create roles
    if (req.adminRole !== "super_admin") {
      return res.status(403).json({ status: 403, message: "Only Super Admin can create roles" });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      return res.status(400).json({ status: 400, message: "This role already exists" });
    }

    const role = await Role.create({
      name: name.toLowerCase(),
      description,
      createdBy: req.adminId,
    });

    return res.status(201).json({
      status: 201,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    console.error("Create Role Error:", error);
    return res.status(500).json({ status: 500, message: "Server error creating role" });
  }
};

// ---------------- Get All Roles ----------------
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    return res.status(200).json({
      status: 200,
      message: "Roles fetched successfully",
      data: roles,
    });
  } catch (error) {
    console.error("Get Roles Error:", error);
    return res.status(500).json({ status: 500, message: "Server error fetching roles" });
  }
};

// ---------------- Delete Role ----------------
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.adminRole !== "super_admin") {
      return res.status(403).json({ status: 403, message: "Only Super Admin can delete roles" });
    }

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ status: 404, message: "Role not found" });
    }

    await Role.findByIdAndDelete(id);
    return res.status(200).json({
      status: 200,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Delete Role Error:", error);
    return res.status(500).json({ status: 500, message: "Server error deleting role" });
  }
};

module.exports = { createRole, getRoles, deleteRole };
