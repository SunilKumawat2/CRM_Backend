const StockItem = require("../models/StockItem");
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const mongoose = require("mongoose");

// Stock CRUD
const createStockItem = async (req,res) => {
  try {
    const { name, category, unit, quantity=0, unitCost=0, supplier } = req.body;
    if (!name) return res.status(400).json({ status:400, message:"Name required" });
    const item = await StockItem.create({ name, category, unit, quantity, unitCost, supplier, lastReceivedAt: null });
    return res.status(201).json({ status:201, message:"Stock item created", data:item });
  } catch(err) {
    console.error("Create Stock Item Error:", err);
    return res.status(500).json({ status:500, message:"Server error creating stock item" });
  }
};

const getStockItems = async (req,res) => {
  try {
    const { query, category, page=1, limit=50 } = req.query;
    const q = {};
    if (query) q.name = { $regex: query, $options: "i" };
    if (category) q.category = category;
    const skip = (parseInt(page)-1)*parseInt(limit);
    const [total, items] = await Promise.all([
      StockItem.countDocuments(q),
      StockItem.find(q).populate("supplier","name").skip(skip).limit(parseInt(limit))
    ]);
    return res.status(200).json({ status:200, total, data:items });
  } catch(err) {
    console.error("Get Stock Items Error:", err);
    return res.status(500).json({ status:500, message:"Server error fetching stock items" });
  }
};

// Update stock qty (used when receiving PO or using item)
const updateStockQuantity = async (req,res) => {
  try {
    const { id } = req.params;
    const { quantity, lastReceivedAt } = req.body;
    const item = await StockItem.findById(id);
    if (!item) return res.status(404).json({ status:404, message:"Stock item not found" });
    if (typeof quantity !== "undefined") item.quantity = quantity;
    if (lastReceivedAt) item.lastReceivedAt = new Date(lastReceivedAt);
    await item.save();
    return res.status(200).json({ status:200, message:"Stock updated", data:item });
  } catch(err) {
    console.error("Update Stock Error:", err);
    return res.status(500).json({ status:500, message:"Server error updating stock" });
  }
};

// Supplier CRUD
const createSupplier = async (req,res) => {
  try {
    const { name, contactName, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ status:400, message:"Supplier name required" });
    const s = await Supplier.create({ name, contactName, email, phone, address });
    return res.status(201).json({ status:201, message:"Supplier created", data:s });
  } catch(err) {
    console.error("Create Supplier Error:", err);
    return res.status(500).json({ status:500, message:"Server error creating supplier" });
  }
};

// Purchase Order creation
const createPurchaseOrder = async (req,res) => {
  try {
    const { supplier, items = [] } = req.body;
    if (!supplier || !items.length) return res.status(400).json({ status:400, message:"Supplier and items required" });

    // compute totals
    let subtotal = 0;
    const poItems = items.map(i => {
      const total = i.qty * i.unitCost;
      subtotal += total;
      return { item: i.item, qty: i.qty, unitCost: i.unitCost, total };
    });

    const total = subtotal; // tax handling optional
    const po = await PurchaseOrder.create({
      poNumber: `PO${Date.now().toString().slice(-8)}${Math.floor(Math.random()*900+100)}`,
      supplier,
      items: poItems,
      subtotal,
      total,
      status: "ordered",
      orderedAt: new Date(),
      createdBy: req.adminId
    });

    return res.status(201).json({ status:201, message:"Purchase order created", data:po });
  } catch(err) {
    console.error("Create PO Error:", err);
    return res.status(500).json({ status:500, message:"Server error creating PO" });
  }
};

// Receive PO (mark as received and increment stock)
const receivePurchaseOrder = async (req,res) => {
  try {
    const { id } = req.params; // PO id
    const po = await PurchaseOrder.findById(id).populate("items.item");
    if (!po) return res.status(404).json({ status:404, message:"PO not found" });

    if (po.status === "received") return res.status(400).json({ status:400, message:"PO already received" });

    // update stock items
    for (const it of po.items) {
      const stock = await StockItem.findById(it.item._id);
      if (stock) {
        stock.quantity = (stock.quantity || 0) + it.qty;
        stock.lastReceivedAt = new Date();
        await stock.save();
      }
    }

    po.status = "received";
    po.receivedAt = new Date();
    await po.save();

    return res.status(200).json({ status:200, message:"PO received and stock updated", data:po });
  } catch(err) {
    console.error("Receive PO Error:", err);
    return res.status(500).json({ status:500, message:"Server error receiving PO" });
  }
};

module.exports = {
  createStockItem, getStockItems, updateStockQuantity,
  createSupplier, createPurchaseOrder, receivePurchaseOrder
};
