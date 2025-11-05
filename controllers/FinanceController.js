const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Expense = require("../models/Expense");
const Booking = require("../models/Booking");
const mongoose = require("mongoose");

// helper invoice number generator
const genInvoiceNo = () => `INV${Date.now().toString().slice(-8)}${Math.floor(Math.random()*900+100)}`;

// Create invoice (manually or from booking)
const createInvoice = async (req, res) => {
  try {
    const { booking, guest, items = [], dueDate } = req.body;
    if (!items || !items.length) return res.status(400).json({ status:400, message:"Invoice items required" });

    // compute totals
    let subtotal = 0, taxes = 0;
    items.forEach(i => {
      i.total = (i.qty||1) * (i.unitPrice||0) + (i.tax||0);
      subtotal += (i.qty||1)*(i.unitPrice||0);
      taxes += i.tax||0;
    });
    const total = subtotal + taxes;

    const invoice = await Invoice.create({
      invoiceNumber: genInvoiceNo(),
      booking: booking || null,
      guest: guest || null,
      items,
      subtotal,
      taxes,
      total,
      balance: total,
      dueDate,
      createdBy: req.adminId
    });

    return res.status(201).json({ status:201, message:"Invoice created", data: invoice });
  } catch (err) {
    console.error("Create Invoice Error:", err);
    return res.status(500).json({ status:500, message:"Server error creating invoice" });
  }
};

// Get invoices (filters)
const getInvoices = async (req, res) => {
  try {
    const { status, guest, booking, page=1, limit=50 } = req.query;
    const q = {};
    if (status) q.status = status;
    if (guest) q.guest = guest;
    if (booking) q.booking = booking;

    const skip = (Math.max(1, parseInt(page))-1)*parseInt(limit);
    const [total, invoices] = await Promise.all([
      Invoice.countDocuments(q),
      Invoice.find(q).populate("guest","fullName email").populate("booking","bookingNumber").skip(skip).limit(parseInt(limit)).sort({issuedAt:-1})
    ]);
    return res.status(200).json({ status:200, message:"Invoices fetched", total, data: invoices });
  } catch (err) {
    console.error("Get Invoices Error:", err);
    return res.status(500).json({ status:500, message:"Server error fetching invoices" });
  }
};

// Get invoice by id
const getInvoiceById = async (req,res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("guest").populate("booking");
    if (!invoice) return res.status(404).json({ status:404, message:"Invoice not found" });
    return res.status(200).json({ status:200, data: invoice });
  } catch (err) {
    console.error("Get Invoice Error:", err);
    return res.status(500).json({ status:500, message:"Server error fetching invoice" });
  }
};

// Create Payment
const createPayment = async (req, res) => {
    try {
      console.log("Incoming payment body:", req.body);
  
      const { invoiceId, amount, method, transactionId, status } = req.body;
  
      if (!invoiceId || !amount || !method) {
        return res.status(400).json({
          status: 400,
          message: "invoiceId, amount and method are required",
        });
      }
  
      const payment = await Payment.create({
        invoice: invoiceId, // your schema probably has `invoice` as ObjectId
        amount,
        method,
        transactionId,
        status,
        createdBy: req.adminId,
      });
  
      res.status(201).json({
        status: 201,
        message: "Payment created successfully",
        data: payment,
      });
    } catch (err) {
      console.error("Create Payment Error:", err);
      res.status(500).json({
        status: 500,
        message: "Server error creating payment",
      });
    }
  };
  
  

// Create expense
const createExpense = async (req,res) => {
  try {
    const { title, amount, category, vendor, paidAt, notes } = req.body;
    if (!title || !amount) return res.status(400).json({ status:400, message:"title and amount required" });

    const expense = await Expense.create({
      title, amount, category, vendor, paidAt, notes, createdBy: req.adminId
    });

    return res.status(201).json({ status:201, message:"Expense recorded", data: expense });
  } catch (err) {
    console.error("Create Expense Error:", err);
    return res.status(500).json({ status:500, message:"Server error creating expense" });
  }
};

// Basic revenue/expense report (range)
const getFinancialReport = async (req,res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ status:400, message:"start and end required (YYYY-MM-DD)" });

    const s = new Date(start);
    const e = new Date(end);
    e.setHours(23,59,59,999);

    // revenue = payments in range; expenses = expense paidAt in range
    const payments = await Payment.aggregate([
      { $match: { paidAt: { $gte: s, $lte: e }, status: "success" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]);
    const expenses = await Expense.aggregate([
      { $match: { paidAt: { $gte: s, $lte: e } } },
      { $group: { _id: null, totalExpense: { $sum: "$amount" } } }
    ]);

    const totalRevenue = payments[0]?.totalRevenue || 0;
    const totalExpense = expenses[0]?.totalExpense || 0;
    const profit = totalRevenue - totalExpense;

    return res.status(200).json({ status:200, data:{ totalRevenue, totalExpense, profit }});
  } catch (err) {
    console.error("Financial Report Error:", err);
    return res.status(500).json({ status:500, message:"Server error generating report" });
  }
};

module.exports = {
  createInvoice, getInvoices, getInvoiceById, createPayment, createExpense, getFinancialReport
};
