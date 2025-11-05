const mongoose = require("mongoose");

const stockItemSchema = new mongoose.Schema({
  sku: { type: String, default: "" },
  name: { type: String, required: true },
  category: { type: String, default: "" }, // minibar, kitchen, housekeeping
  unit: { type: String, default: "pcs" },
  quantity: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  unitCost: { type: Number, default: 0 },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },
  lastReceivedAt: Date,
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model("StockItem", stockItemSchema);
