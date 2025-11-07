const mongoose = require("mongoose");


const eventPackageSchema = new mongoose.Schema(
{
name: { type: String, required: true },
description: { type: String, default: "" },
pricePerPerson: { type: Number, required: true },
itemsIncluded: [{ type: String }],


createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminLogin" }
},
{ timestamps: true }
);


module.exports = mongoose.model("EventPackage", eventPackageSchema);