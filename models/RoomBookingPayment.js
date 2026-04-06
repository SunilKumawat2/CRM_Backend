// const mongoose = require("mongoose");

// const roomBookingPaymentSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },

//   checkIn: { type: Date, required: true },
//   checkOut: { type: Date, required: true },
//   nights: { type: Number, required: true },

//   amount: { type: Number, required: true },
//   currency: { type: String, default: "INR" },

//   razorpay_order_id: { type: String },
//   razorpay_payment_id: { type: String },
//   razorpay_signature: { type: String },

//   status: {
//     type: String,
//     enum: ["created", "paid", "failed"],
//     default: "created",
//   },

// }, { timestamps: true });

// module.exports = mongoose.model("RoomBookingPayment", roomBookingPaymentSchema);

const mongoose = require("mongoose");

const roomBookingPaymentSchema = new mongoose.Schema(
  {
    // 🔗 EXISTING (keep)
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },

    checkIn: Date,
    checkOut: Date,
    nights: Number,

    // 🔥 NEW (IMPORTANT)
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },

    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    // 🔥 PAYMENT METHOD (NEW)
    method: {
      type: String,
      enum: ["cash", "upi", "card", "razorpay"],
      required: true,
    },

    // 🔥 COMMON TRANSACTION ID
    transactionId: { type: String },

    // 🔥 Razorpay (keep)
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,

    // 🔥 IMPROVED STATUS
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    paidAt: { type: Date, default: Date.now },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "RoomBookingPayment",
  roomBookingPaymentSchema
);