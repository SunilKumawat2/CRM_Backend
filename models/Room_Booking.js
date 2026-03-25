const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    amount: { type: Number, required: true }, // amount in INR
    currency: { type: String, default: "INR" },
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    payment_method: { type: String, default: "razorpay" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("room_payment", paymentSchema);