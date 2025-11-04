// controllers/BookingController.js
const Booking = require("../models/Booking");
const Room = require("../models/Room");

// Simple booking number generator (prefix + timestamp + random)
const generateBookingNumber = () =>
  `BK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;

const createBooking = async (req, res) => {
  try {
    const {
      guestName,
      guestContact,
      guestEmail,
      rooms, // array of { room: roomId, rate, guests, extraInfo }
      checkIn,
      checkOut,
      source,
      paymentStatus,
      totalAmount,
      depositAmount,
      groupBookingId,
      notes,
    } = req.body;

    if (!guestName || !rooms || !rooms.length || !checkIn || !checkOut) {
      return res.status(400).json({ status: 400, message: "Missing required booking fields" });
    }

    // Optional: validate room availability here (basic)
    // For each room in request, check isAvailable true or more advanced reservation conflict checks
    for (const r of rooms) {
      const roomDoc = await Room.findById(r.room);
      if (!roomDoc) {
        return res.status(404).json({ status: 404, message: `Room not found: ${r.room}` });
      }
      // Not enforcing date conflicts here — you can add advanced availability checks if needed
      r.roomNumber = roomDoc.roomNumber || roomDoc.roomNumber;
    }

    const booking = await Booking.create({
      bookingNumber: generateBookingNumber(),
      guestName,
      guestContact,
      guestEmail,
      rooms,
      checkIn,
      checkOut,
      status: "confirmed",
      source: source || "manual",
      paymentStatus: paymentStatus || "unpaid",
      totalAmount: totalAmount || 0,
      depositAmount: depositAmount || 0,
      groupBookingId: groupBookingId || null,
      notes,
      createdBy: req.adminId,
    });

    return res.status(201).json({ status: 201, message: "Booking created", data: booking });
  } catch (err) {
    console.error("Create Booking Error:", err);
    return res.status(500).json({ status: 500, message: "Server error creating booking" });
  }
};

const getBookings = async (req, res) => {
  try {
    // Filters: status, source, date range, guestName, roomNumber
    const { status, source, guestName, roomNumber, startDate, endDate, page = 1, limit = 50 } = req.query;
    const q = {};

    if (status) q.status = status;
    if (source) q.source = source;
    if (guestName) q.guestName = { $regex: guestName, $options: "i" };
    if (roomNumber) q["rooms.roomNumber"] = roomNumber;

    if (startDate && endDate) {
      // find bookings that overlap with the given window
      q.$or = [
        { checkIn: { $lte: new Date(endDate) }, checkOut: { $gte: new Date(startDate) } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [total, bookings] = await Promise.all([
      Booking.countDocuments(q),
      Booking.find(q)
        .populate("createdBy", "name email")
        .populate("rooms.room", "roomNumber roomType")
        .sort({ checkIn: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
    ]);

    return res.status(200).json({ status: 200, message: "Bookings fetched", data: bookings, total });
  } catch (err) {
    console.error("Get Bookings Error:", err);
    return res.status(500).json({ status: 500, message: "Server error fetching bookings" });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("createdBy", "name email")
      .populate("rooms.room", "roomNumber roomType");
    if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });
    return res.status(200).json({ status: 200, data: booking });
  } catch (err) {
    console.error("Get Booking Error:", err);
    return res.status(500).json({ status: 500, message: "Server error fetching booking" });
  }
};

const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });

    // Prevent illegal status transitions if needed
    Object.assign(booking, updates);
    await booking.save();

    return res.status(200).json({ status: 200, message: "Booking updated", data: booking });
  } catch (err) {
    console.error("Update Booking Error:", err);
    return res.status(500).json({ status: 500, message: "Server error updating booking" });
  }
};

const checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });

    if (booking.status === "checked_in") {
      return res.status(400).json({ status: 400, message: "Already checked in" });
    }

    booking.status = "checked_in";
    await booking.save();

    // Optionally update Room availability / housekeeping
    for (const r of booking.rooms) {
      await Room.findByIdAndUpdate(r.room, { isAvailable: false, housekeepingStatus: "Dirty" });
    }

    return res.status(200).json({ status: 200, message: "Checked in successfully", data: booking });
  } catch (err) {
    console.error("Checkin Error:", err);
    return res.status(500).json({ status: 500, message: "Server error during check-in" });
  }
};

const checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });

    if (booking.status !== "checked_in") {
      return res.status(400).json({ status: 400, message: "Cannot check out if not checked in" });
    }

    booking.status = "checked_out";
    await booking.save();

    // Optionally update Room availability / housekeeping
    for (const r of booking.rooms) {
      await Room.findByIdAndUpdate(r.room, { isAvailable: true, housekeepingStatus: "Dirty" });
    }

    return res.status(200).json({ status: 200, message: "Checked out successfully", data: booking });
  } catch (err) {
    console.error("Checkout Error:", err);
    return res.status(500).json({ status: 500, message: "Server error during check-out" });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ status: 404, message: "Booking not found" });

    booking.status = "cancelled";
    booking.cancelledBy = req.adminId;
    booking.cancelledAt = new Date();
    booking.notes = (booking.notes || "") + `\nCancelled: ${reason || "No reason provided"}`;

    await booking.save();

    // Optionally free rooms
    for (const r of booking.rooms) {
      await Room.findByIdAndUpdate(r.room, { isAvailable: true });
    }

    return res.status(200).json({ status: 200, message: "Booking cancelled", data: booking });
  } catch (err) {
    console.error("Cancel Booking Error:", err);
    return res.status(500).json({ status: 500, message: "Server error cancelling booking" });
  }
};

// Calendar endpoint: returns bookings overlapping the date range
const getCalendar = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ status: 400, message: "start and end are required (YYYY-MM-DD)" });

    const startDate = new Date(start);
    const endDate = new Date(end);
    // find bookings overlapping the range
    const bookings = await Booking.find({
      checkIn: { $lte: endDate },
      checkOut: { $gte: startDate },
      status: { $ne: "cancelled" },
    })
      .populate("rooms.room", "roomNumber roomType")
      .select("bookingNumber guestName checkIn checkOut rooms status");

    return res.status(200).json({ status: 200, message: "Calendar bookings fetched", data: bookings });
  } catch (err) {
    console.error("Calendar Error:", err);
    return res.status(500).json({ status: 500, message: "Server error fetching calendar" });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  checkIn,
  checkOut,
  cancelBooking,
  getCalendar,
};
