// serverless.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const vercelExpress = require("vercel-express");
const ApiRouter = require("./routes/ApiRoutes");

// ---------------- MongoDB Connection ----------------
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  const mongoUri = process.env.MONGODB_BASE_URL;
  if (!mongoUri) throw new Error("MONGODB_BASE_URL not defined in environment variables");

  cachedDb = await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("✅ MongoDB Connected");
  return cachedDb;
}

// ---------------- Express App ----------------
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files if needed (temporary, will not persist in Vercel)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------- Ensure DB Connection Before Routes ----------------
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error("❌ DB connection error:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ---------------- API Routes ----------------
app.use("/crm/api", ApiRouter);

// ---------------- Export for Vercel ----------------
module.exports = vercelExpress(app);
