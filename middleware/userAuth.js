const jwt = require("jsonwebtoken");
const User = require("../models/Users"); // Replace with your User model

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ status: 401, message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;

    const user = await User.findById(decoded.id).select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    req.user = user;

    next();
  } catch (err) {
    console.error("User Auth Middleware Error:", err);
    return res.status(401).json({ status: 401, message: "Invalid or expired token" });
  }
};