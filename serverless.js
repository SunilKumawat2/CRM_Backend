// require("dotenv").config();
// const dbConnect = require("./config/DbConnection");
// const cors = require("cors");
// const express = require("express");
// const path = require("path");
// const ApiRouter = require("./routes/ApiRoutes");

// const app = express();
// app.use(express.json());
// app.use(cors());

// // ✅ Serve static files for uploaded images
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // 🔹 Middleware to ensure DB is connected before each request
// app.use(async (req, res, next) => {
//   try {
//     await dbConnect(process.env.MONGODB_BASE_URL);
//     next();
//   } catch (err) {
//     console.error("❌ MongoDB connection failed:", err);
//     return res.status(503).json({ message: "Database not connected yet" });
//   }
// });

// // 🔹 API routes
// app.use("/crm/api", ApiRouter);

// module.exports = app;

require("dotenv").config();
const dbConnect = require("./config/DbConnection");
const cors = require("cors");
const express = require("express");
const path = require("path");
const ApiRouter = require("./routes/ApiRoutes");
const serverless = require("serverless-http"); // ✅ ADD THIS

const app = express();

app.use(express.json());
app.use(cors());

// static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB connection middleware (good approach 👍)
let isConnected = false;

app.use(async (req, res, next) => {
  try {
    if (!isConnected) {
      await dbConnect(process.env.MONGODB_BASE_URL);
      isConnected = true;
    }
    next();
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    return res.status(503).json({ message: "Database not connected yet" });
  }
});

// routes
app.use("/crm/api", ApiRouter);

// ✅ THIS IS THE MOST IMPORTANT LINE
module.exports = serverless(app);