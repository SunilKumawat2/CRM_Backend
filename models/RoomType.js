const mongoose = require("mongoose");

const roomTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    //   required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomType", roomTypeSchema);