const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    permissions: [
      {
        module: { type: String, required: true }, 
        actions: [{ type: String, enum: ["view", "create", "edit", "delete"] }],
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
