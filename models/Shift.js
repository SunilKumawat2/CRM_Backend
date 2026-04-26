const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // Morning, Evening, Night
  },

  startTime: {
    type: String, // "09:00"
    required: true,
  },

  endTime: {
    type: String, // "18:00"
    required: true,
  },

  isNightShift: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Shift", shiftSchema);