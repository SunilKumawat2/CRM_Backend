require("dotenv").config();
const dbconnection = require("./config/DbConnection");
const cors = require("cors");
const express = require("express");
const path = require("path");
const ApiRouter = require("./routes/ApiRoutes");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Serve static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔹 Connect to MongoDB before starting routes
(async () => {
  try {
    await dbconnection();

    // Middleware for the routes 
    app.use("/crm/api", ApiRouter);

    const port = process.env.PORT || 4005;
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
})();

console.log("hello this is CRM server");
