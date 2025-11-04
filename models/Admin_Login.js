const mongoose = require("mongoose");

const adminLoginSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String, trim: true, default: "" },
    profileImage: { type: String, default: "" },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null },
    isSuperAdmin: { type: Boolean, default: false },
    extraFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminLogin", adminLoginSchema);
