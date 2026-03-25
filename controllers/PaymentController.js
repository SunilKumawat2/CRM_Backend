const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Room_Booking");
const Room = require("../models/Room");
const User = require("../models/Users");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ------------------ Create Payment / Order ------------------
const createPaymentOrder = async (req, res) => {
  try {
    const { userId, roomId } = req.body;

    const user = await User.findById(userId);
    const room = await Room.findById(roomId);

    if (!user || !room) {
      return res.status(404).json({ success: false, message: "User or Room not found" });
    }

    // ✅ Correct amount calculation
    const amount = room.discountedPrice > 0
      ? room.baseRate - room.discountedPrice
      : room.baseRate;

    const options = {
      amount: amount * 100, // in paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
      user: user._id,
      room: room._id,
      amount: amount,
      currency: "INR",
      razorpay_order_id: order.id,
      status: "created",
    });

    res.status(200).json({ success: true, order, paymentId: payment._id });
  } catch (err) {
    console.error("Payment Order Error:", err);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
};

// ------------------ Verify Payment ------------------
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    // Signature validation
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Payment lookup
    const payment = await Payment.findById(paymentId).populate("room");
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    // Update payment status
    payment.razorpay_payment_id = razorpay_payment_id;
    payment.razorpay_signature = razorpay_signature;
    payment.status = "paid";
    await payment.save();

    // ✅ Update room availability
    const room = await Room.findById(payment.room._id);
    if (room) {
      room.isAvailable = false; // room is now booked
      await room.save();
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment,
      room, // send room info back if needed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

module.exports = { createPaymentOrder, verifyPayment };