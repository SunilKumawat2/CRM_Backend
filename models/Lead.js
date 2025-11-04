const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    lead_name: { type: String, required: true, trim: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    telephone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    lead_value: { type: Number, default: 0 },
    assigned: { type: String, required: true, trim: true },
    notes: { type: String, default: "", trim: true },
    source: { type: String, trim: true },

    // 🆕 Link to category
    category: { type: mongoose.Schema.Types.ObjectId, ref: "categories" },

    tags: [{ type: String, trim: true }],
    last_contacted_date: { type: Date },
    total_budget: { type: Number, default: 0 },
    target_date: { type: Date },
    content_type: { type: String, trim: true },
    brand_name: { type: String, trim: true },
    company_name: { type: String, trim: true },
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip_code: { type: String, trim: true },
    country: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
