require("dotenv").config();
const dbconnection = require("./config/DbConnection");
const cors = require("cors");
const express = require("express");
const path = require("path");
const ApiRouter = require("./routes/ApiRoutes");
const UserApiRouter = require("./routes/UserApiRoutes");
const http = require("http");
const { initSocket } = require("./middleware/socket"); // ✅ import
const startAttendanceCron = require("./cron/AutoAttendance");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

(async () => {
  try {
    await dbconnection();
    // ✅ START CRON HERE
    startAttendanceCron();
    app.use("/crm/api", ApiRouter);
    app.use("/crm/api", UserApiRouter);
    // For Razorpay webhook (raw body needed)
    app.use("/api/payment/razorpay-webhook", express.raw({ type: "*/*" }));
    const port = process.env.PORT || 4005;

    // ✅ Create HTTP server & initialize socket
    const server = http.createServer(app);
    const io = initSocket(server);

    // Make io available globally in app
    app.set("io", io);

    server.listen(port, () => console.log(`Server started on port ${port}`));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
})();
