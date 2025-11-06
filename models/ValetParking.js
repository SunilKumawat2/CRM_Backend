const mongoose = require("mongoose");

const valetParkingSchema = new mongoose.Schema(
    {
        guestName: { type: String, required: true },
        roomNumber: { type: String, default: "" },

        vehicleNumber: { type: String, required: true },
        vehicleBrand: { type: String, default: "" },
        vehicleModel: { type: String, default: "" },
        color: { type: String, default: "" },

        parkingSlot: { type: String, default: "" },
        slipNumber: { type: String, required: true, unique: true },

        inTime: { type: Date, default: Date.now },
        outTime: { type: Date },

        status: {
            type: String,
            enum: ["Parked", "Requested", "Delivered"],
            default: "Parked",
          },

          requestedAt: { type: Date },
          deliveredAt: { type: Date },

          notes: { type: String, default: "" },


    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ValetParking", valetParkingSchema);