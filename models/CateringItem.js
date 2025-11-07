const mongoose = require("mongoose");


const cateringItemSchema = new mongoose.Schema(
    {
    itemName: { type: String, required: true },
    category: { type: String, default: "Food" }, // Food / Beverage
    price: { type: Number, required: true },
    description: { type: String, default: "" },
    
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin" }
    },
    { timestamps: true }
    );
    
    
    module.exports = mongoose.model("CateringItem", cateringItemSchema);