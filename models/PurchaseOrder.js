const mongoose = require("mongoose");

const poItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "StockItem", required: true },
  qty: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  total: { type: Number, required: true }
});

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  items: [poItemSchema],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ["draft","ordered","received","cancelled"], default: "draft" },
  orderedAt: Date,
  receivedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin" }
}, { timestamps: true });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
