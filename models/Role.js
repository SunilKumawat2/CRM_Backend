const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // ✅ prevent duplicates (e.g. "manager" can't be created twice)
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin", // Super Admin reference
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
