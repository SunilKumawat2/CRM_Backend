// const mongoose = require("mongoose");
// require("dotenv").config();
// const mongodb = mongoose.connect(process.env.MONGODB_BASE_URL) //mongodb+srv://sunilmi7891:7HJMHO5iHWJVeAy7@cluster0.73wobrn.mongodb.net
//     .then(() => {
//         console.log("Sucessfully Connect with the CRM Database")
//     }).catch(() => {
//         console.log("Not Connect with the CRM Database")

//     })
// module.exports = mongodb

const mongoose = require("mongoose");

let isConnected = false;

const dbconnection = async () => {
  if (isConnected) {
    console.log("✅ Using existing database connection");
    return;
  }

  if (!process.env.MONGODB_BASE_URL) {
    console.error("❌ MONGODB_BASE_URL is missing!");
    throw new Error("Missing MONGODB_BASE_URL environment variable");
  }

  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_BASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("✅ Successfully connected to CRM Database");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
};

module.exports = dbconnection;
