const mongoose = require("mongoose");

const seasonalRateSchema = new mongoose.Schema({
  seasonName: { type: String, required: true }, // e.g. "Peak Season", "Off-Season"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: Number, required: true },
});

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    roomType: {
      type: String,
      enum: ["Standard", "Deluxe", "Suite"],
      required: true,
    },
    baseRate: { type: Number, required: true }, // Default price
    seasonalRates: [seasonalRateSchema], // Optional seasonal rates
    isAvailable: { type: Boolean, default: true },
    housekeepingStatus: {
      type: String,
      enum: ["Clean", "Dirty", "Under Maintenance"],
      default: "Clean",
    },
    amenities: [{ type: String }], // e.g., ["AC", "TV", "WiFi"]
    description: { type: String, default: "" },
    images: [{ type: String }], // image URLs or paths
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
