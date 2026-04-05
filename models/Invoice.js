const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  qty: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 }, // tax as percentage
  total: { type: Number, default: 0, min: 0 },
});

const invoiceSchema = new mongoose.Schema(
  {
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

    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid",
    },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date },

    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],
    expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Expense" }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin" },
  },
  { timestamps: true }
);

// Pre-save hook to auto-calculate totals if items changed
invoiceSchema.pre("save", function (next) {
  if (this.isModified("items") || this.isNew) {
    let subtotal = 0;
    let taxes = 0;

    this.items.forEach((item) => {
      const lineTotal = (item.qty || 1) * (item.unitPrice || 0);
      const lineTax = (item.tax || 0) / 100 * lineTotal;
      item.total = lineTotal + lineTax;

      subtotal += lineTotal;
      taxes += lineTax;
    });

    this.subtotal = subtotal;
    this.taxes = taxes;
    this.total = subtotal + taxes - (this.discounts || 0);
    this.balance = this.total - (this.paidAmount || 0);

    // update status automatically
    if (this.paidAmount === 0) this.status = "unpaid";
    else if (this.paidAmount < this.total) this.status = "partial";
    else this.status = "paid";
  }

  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);