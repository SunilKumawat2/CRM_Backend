const jwt = require("jsonwebtoken");
const AdminLogin = require("../models/Admin_Login");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ status: 401, message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach basic info
    req.adminId = decoded.id;
    req.isSuperAdmin = decoded.isSuperAdmin || false;

    // Optional: get full admin info for role checks
    const admin = await AdminLogin.findById(decoded.id).populate("role");

    if (!admin) {
      return res.status(404).json({ status: 404, message: "Admin not found" });
    }

    // 🔹 Attach role and permissions to the request
    req.adminRole = admin.isSuperAdmin ? "super_admin" : admin.role?.name || null;
    req.permissions = admin.role?.permissions || [];

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(401).json({ status: 401, message: "Invalid or expired token" });
  }
};
