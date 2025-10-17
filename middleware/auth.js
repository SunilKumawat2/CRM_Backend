require("dotenv").config(); // Load .env file
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: 401,
        message: "No token provided",
      });
    }

    // Verify token using JWT_SECRET from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded data to request object
    req.adminId = decoded.id;
    req.adminRole = decoded.role; // ✅ used to check if Super Admin

    next(); // Continue to controller
  } catch (err) {
    return res.status(401).json({
      status: 401,
      message: "Invalid or expired token",
    });
  }
};

module.exports = auth;
