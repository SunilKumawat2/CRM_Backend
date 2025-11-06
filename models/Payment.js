const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["cash","card","upi","paypal","wallet","other"], required: true },
  reference: { type: String, default: "" }, // txn id from gateway
  status: { type: String, enum: ["success","failed","pending"], default: "success" },
  paidAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin" }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);