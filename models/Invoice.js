const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  description: String,
  qty: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  tax: { type: Number, default: 0 }, // tax amount or percent (decide standard)
  total: { type: Number, default: 0 }, // qty * unitPrice + tax
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
  guest: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", default: null },
  items: [invoiceItemSchema],
  subtotal: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  discounts: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ["unpaid", "partial", "paid", "refunded"], default: "unpaid" },
  issuedAt: { type: Date, default: Date.now },
  dueDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin" }
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
