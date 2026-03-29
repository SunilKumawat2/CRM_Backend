const mongoose = require("mongoose");

const roomBookingPaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },

  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  nights: { type: Number, required: true },

  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },

  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },

  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created",
  },

}, { timestamps: true });

module.exports = mongoose.model("RoomBookingPayment", roomBookingPaymentSchema);