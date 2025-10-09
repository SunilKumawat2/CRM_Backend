const jwt = require("jsonwebtoken");
const JWT_SECRET = "SDFJHSD8723ydshf8723yhsdfYHDS8723";

const auth = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ status: 401, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ status: 401, message: "Invalid token" });
  }
};

module.exports = auth;
