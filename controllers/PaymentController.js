const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/RoomBookingPayment");
const Room = require("../models/Room");
const User = require("../models/Users");
const Booking = require("../models/Booking");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ------------------ Create Payment / Order ------------------
const createPaymentOrder = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut } = req.body;

    // ✅ Validate input
    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ✅ Get user from token
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    // ✅ Validate nights
    if (nights <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid date selection",
      });
    }

    // ✅ Price calculation
    const rate =
      room.discountedPrice > 0
        ? room.baseRate - room.discountedPrice
        : room.baseRate;

    const totalAmount = rate * nights;

    // ✅ Validate amount
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount calculation",
      });
    }

    // ✅ Create Razorpay order
    const order = await razorpay.orders.create({
      amount: totalAmount * 100, // paisa -> paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // ✅ Save temp payment
    const payment = await Payment.create({
      user: user._id,
      room: room._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      amount: totalAmount,
      currency: "INR",
      razorpay_order_id: order.id,
      status: "created",
    });

    return res.status(200).json({
      success: true,
      order,
      paymentId: payment._id,
    });

  } catch (err) {
    console.error("Payment Order Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

// ------------------ Verify Payment ------------------
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
    } = req.body;

    // ✅ Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate("room")
      .populate("user");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // ✅ Update payment
    payment.status = "paid";
    payment.razorpay_payment_id = razorpay_payment_id;
    payment.razorpay_signature = razorpay_signature;
    await payment.save();

    // ✅ Create booking
   const booking = await Booking.create({
  bookingNumber: `BK${Date.now()}`,

  user: payment.user?._id,

  guestName:
    payment.user?.name ||
    payment.user?.fullName ||
    "Guest",

  guestContact: payment.user?.phone || "",
  guestEmail: payment.user?.email || "",

  rooms: [
    {
      room: payment.room._id,
      roomNumber: payment.room.roomNumber,
      rate: payment.amount / payment.nights,
    },
  ],

  checkIn: payment.checkIn,
  checkOut: payment.checkOut,

  status: "confirmed",
  source: "online",
  paymentStatus: "paid",
  totalAmount: payment.amount,
});

    // ✅ Mark room unavailable
    await Room.findByIdAndUpdate(payment.room._id, {
      isAvailable: false,
    });

    return res.status(200).json({
      success: true,
      message: "Payment successful & booking created",
      booking,
    });

  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

// ------------------ Razorpay Webhook ------------------
const razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const body = req.body; // raw body

  // Verify webhook signature
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  const event = JSON.parse(body).event;
  const payload = JSON.parse(body).payload.payment.entity;

  try {
    if (event === "payment.captured") {
      // Find the payment
      const payment = await Payment.findOne({ razorpay_order_id: payload.order_id })
        .populate("user")
        .populate("room");

      if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

      // Update payment status
      payment.status = "paid";
      payment.razorpay_payment_id = payload.id;
      await payment.save();

      // Check if booking already exists
      const bookingExists = await Booking.findOne({
        paymentStatus: "paid",
        user: payment.user._id,
        checkIn: payment.checkIn,
      });

      if (!bookingExists) {
        // Create booking
        const booking = await Booking.create({
          bookingNumber: `BK${Date.now()}`,
          user: payment.user._id,
          guestName: payment.user?.name || payment.user?.fullName || "Guest",
          guestContact: payment.user?.phone || "",
          guestEmail: payment.user?.email || "",
          rooms: [
            {
              room: payment.room._id,
              roomNumber: payment.room.roomNumber,
              rate: payment.amount / payment.nights,
            },
          ],
          checkIn: payment.checkIn,
          checkOut: payment.checkOut,
          status: "confirmed",
          source: "online",
          paymentStatus: "paid",
          totalAmount: payment.amount,
        });

        // Mark room unavailable
        await Room.findByIdAndUpdate(payment.room._id, { isAvailable: false });
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createPaymentOrder, verifyPayment,razorpayWebhook };