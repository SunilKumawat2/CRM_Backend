const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    customer_name: { type: String, required: true, trim: true },
    loan_amount: { type: Number, required: true, min: 0 },
    per_day_collection: { type: Number, required: true, min: 0 },
    total_due_installment: { type: Number, required: true, min: 0 },
    day_for_loan: { type: Number, required: true, min: 1 },

    // 🆕 New required fields
    given_amount: { type: Number, required: true, min: 0 },
    refrence_by: { type: String, required: true, trim: true },
    mobile_no: { type: String, required: true, trim: true },

    // 🆕 Optional fields
    adhar_card: { type: String, default: null, trim: true },
    pan_card: { type: String, default: null, trim: true },

    // Paid info
    total_paid_amount: { type: Number, default: 0 },
    total_paid_installment: { type: Number, default: 0 },
    remaining_balance: { type: Number, default: 0 },
    remaining_installments: { type: Number, default: 0 },
    loan_status: { type: String, enum: ["open", "closed"], default: "open" },

    // Installment history
    installments: [
      {
        amount: { type: Number, required: true, min: 0 },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("collections", collectionSchema);
