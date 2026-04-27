const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["national", "festival", "company"],
      default: "company",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isPaid: {   // 🔥 ADD THIS (salary ke liye)
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ✅ Normalize date before save
holidaySchema.pre("save", function (next) {
  this.date.setHours(0, 0, 0, 0);
  next();
});

// ❗ One holiday per day (safe now)
holidaySchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model("Holiday", holidaySchema);