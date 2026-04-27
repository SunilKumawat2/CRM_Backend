// models/WeeklyOff.js

const mongoose = require("mongoose");

const weeklyOffSchema = new mongoose.Schema(
  {
    days: [
      {
        type: String,
        enum: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
      },
    ],

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeeklyOff", weeklyOffSchema);