const CateringItem = require("../models/CateringItem");


const createCateringItem = async (req, res) => {
try {
const { itemName, category, price, description } = req.body;


if (!itemName || !price)
return res.status(400).json({ status: 400, message: "itemName & price required" });


const item = await CateringItem.create({
itemName,
category,
price,
description,
createdBy: req.adminId
});


res.status(201).json({ status: 201, message: "Catering item created", data: item });
} catch (err) {
res.status(500).json({ status: 500, message: "Server error" });
}
};


const getCateringItems = async (req, res) => {
try {
const data = await CateringItem.find().sort({ createdAt: -1 });
res.status(200).json({ status: 200, message: "Items fetched", data });
} catch (err) {
res.status(500).json({ status: 500, message: "Server error" });
}
};


const updateCateringItem = async (req, res) => {
try {
const item = await CateringItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
if (!item) return res.status(404).json({ status: 404, message: "Item not found" });
res.status(200).json({ status: 200, message: "Item updated", data: item });
} catch (err) {
res.status(500).json({ status: 500, message: "Server error" });
}
};

const deleteCateringItem = async (req, res) => {
try {
const item = await CateringItem.findByIdAndDelete(req.params.id);
if (!item) return res.status(404).json({ status: 404, message: "Item not found" });
res.status(200).json({ status: 200, message: "Item deleted" });
} catch (err) {
res.status(500).json({ status: 500, message: "Server error" });
}
};

module.exports = {
    createCateringItem,
    getCateringItems,
    deleteCateringItem,
    updateCateringItem
}