

// const mongoose = require("mongoose");

// let isConnected = false;

// const dbconnection = async () => {
//   if (isConnected) {
//     console.log("✅ Using existing database connection");
//     return;
//   }

//   if (!process.env.MONGODB_BASE_URL) {
//     console.error("❌ MONGODB_BASE_URL is missing!");
//     throw new Error("Missing MONGODB_BASE_URL environment variable");
//   }

//   try {
//     console.log("🔄 Connecting to MongoDB...");
//     await mongoose.connect(process.env.MONGODB_BASE_URL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     isConnected = true;
//     console.log("✅ Successfully connected to CRM Database");
//   } catch (error) {
//     console.error("❌ Database connection failed:", error);
//     throw error;
//   }
// };

// module.exports = dbconnection;


const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_BASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
};

module.exports = connectDB;
