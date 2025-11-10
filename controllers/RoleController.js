const Role = require("../models/Role");

//<------------- Create Role --------------->
const createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    if (!name) return res.status(400).json({ status: 400, message: "Role name is required" });

    const existing = await Role.findOne({ name });
    if (existing) return res.status(400).json({ status: 400, message: "Role already exists" });

    const role = await Role.create({ name, permissions, createdBy: req.adminId });
    res.status(201).json({ status: 201, message: "Role created successfully", data: role });
  } catch (err) {
    console.error("Create Role Error:", err);
    res.status(500).json({ status: 500, message: "Server error creating role" });
  }
};

// <----------- Get Roles (Paginated) -------------------->
const getRoles = async (req, res) => {
  try {
    let { page = 1, limit = 20, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // ✅ Optional search filter
    if (search) {
      query.name = { $regex: search, $options: "i" }; // assume role has "name"
    }

    const skip = (page - 1) * limit;

    // ✅ Parallel execution for speed
    const [total, roles] = await Promise.all([
      Role.countDocuments(query),
      Role.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    return res.status(200).json({
      status: 200,
      message: "Roles fetched successfully",
      data: roles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error("Get Roles Error:", err);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching roles",
    });
  }
};


//<--------- Delete Role --------------------->
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByIdAndDelete(id);
    if (!role) return res.status(404).json({ status: 404, message: "Role not found" });

    res.status(200).json({ status: 200, message: "Role deleted successfully" });
  } catch (err) {
    console.error("Delete Role Error:", err);
    res.status(500).json({ status: 500, message: "Server error deleting role" });
  }
};

// <------- Update Role Controller -------------->
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ status: 404, message: "Role not found" });
    if (name) role.name = name;
    if (description) role.description = description;
    if (permissions) role.permissions = permissions;

    await role.save();
    return res.status(200).json({ status: 200, message: "Role updated successfully", data: role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 500, message: "Something went wrong" });
  }
};


module.exports = { createRole, getRoles, deleteRole, updateRole };
