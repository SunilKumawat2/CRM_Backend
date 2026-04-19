const Booking = require("../models/Booking");
const Room = require("../models/Room");
const { getIo } = require("../middleware/socket");
const Notification = require("../models/Notification");
const Guest = require("../models/Guest"); // make sure imported

const isSameDay = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// Simple booking number generator (prefix + timestamp + random)
const generateBookingNumber = () =>
  `BK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;

// controllers/BookingController.js
const createBooking = async (req, res) => {
  try {
    const {
      guestName,
      guestContact,
      guestEmail,
      rooms,
      checkIn,
      checkOut,
      source,
      paymentStatus,
      totalAmount,
      depositAmount,
      notes,
    } = req.body;

    if (!guestName || !rooms || !rooms.length || !checkIn || !checkOut) {
      return res.status(400).json({
        status: 400,
        message: "Missing required booking fields",
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // 🔹 Check each room availability for the given dates
    for (const r of rooms) {
      const roomDoc = await Room.findById(r.room);
      if (!roomDoc)
        return res
          .status(404)
          .json({ status: 404, message: `Room not found: ${r.room}` });

      const overlapping = await Booking.findOne({
        status: { $in: ["confirmed", "checked_in"] },
        "rooms.room": r.room,
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate },
      });

      if (overlapping)
        return res
          .status(400)
          .json({
            status: 400,
            message: `Room ${roomDoc.roomNumber} is already booked for selected dates`,
          });

      r.roomNumber = roomDoc.roomNumber;
    }

    // ✅ FIND OR CREATE GUEST (IMPORTANT)
    let guest = await Guest.findOne({
      $or: [{ email: guestEmail }, { phone: guestContact }],
    });

    if (!guest) {
      guest = await Guest.create({
        fullName: guestName,
        email: guestEmail,
        phone: guestContact,
        createdBy: req.adminId,
      });
    }

    const booking = await Booking.create({
      bookingNumber: generateBookingNumber(),
      guestName,
      guestContact,
      guestEmail,
      guest: guest._id,
      rooms,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      status: "confirmed",
      source: "manual", // ✅ IMPORTANT
      source,
      paymentStatus,
      totalAmount,
      depositAmount,
      notes,
      createdBy: req.adminId,
    });

    // ✅ UPDATE CURRENT STAY
    guest.currentStay = {
      booking: booking._id,
      roomNumber: rooms.map((r) => r.roomNumber).join(", "),
      checkIn: checkInDate,
    };

    await guest.save();

    const io = getIo();
    const roomNumbers = rooms.map((r) => r.roomNumber).join(", ");
    const bookingNotif = {
      message: `New booking for ${guestName} 
    | Rooms: ${roomNumbers}`,
      type: "room-booking",
      user: { id: req.adminId, email: guestEmail, phone: guestContact },
    };
    await Notification.create(bookingNotif);
    io.emit("new-booking", bookingNotif);

    return res.status(201).json({
      status: 201,
      message: "Booking created",
      data: booking,
    });
  } catch (err) {
    console.error("Create Booking Error:", err);
    return res
      .status(500)
      .json({ status: 500, message: "Server error creating booking" });
  }
};

const getBookings = async (req, res) => {
  try {
    const {
      status,
      source,
      guestName,
      roomNumber,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const q = {};

    let accessFilter = {};

    // ✅ 🔥 USER ACCESS CONTROL
 if (!req.isSuperAdmin) {
  accessFilter = {
    createdBy: req.adminId
  };
}

    // 🔹 OTHER FILTERS
    if (status) q.status = status;
    if (source) q.source = source;
    if (guestName) q.guestName = { $regex: guestName, $options: "i" };
    if (roomNumber) q["rooms.roomNumber"] = roomNumber;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        checkIn: { $lte: new Date(endDate) },
        checkOut: { $gte: new Date(startDate) },
      };
    }

    // ✅ 🔥 FINAL QUERY (IMPORTANT)
   const finalQuery = {
  $and: [
    q,
    ...(Object.keys(accessFilter).length ? [accessFilter] : []),
    ...(Object.keys(dateFilter).length ? [dateFilter] : []),
  ],
};

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const [total, bookings] = await Promise.all([
      Booking.countDocuments(finalQuery),
      Booking.find(finalQuery)
        .populate("createdBy", "name email")
        .populate("rooms.room", "roomNumber roomType")
        .sort({ checkIn: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
    ]);

    return res.status(200).json({
      status: 200,
      message: "Bookings fetched",
      data: bookings,
      total,
    });
  } catch (err) {
    console.error("Get Bookings Error:", err);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching bookings",
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("createdBy", "name email")
      .populate("rooms.room", "roomNumber roomType");
    if (!booking)
      return res
        .status(404)
        .json({ status: 404, message: "Booking not found" });
    return res.status(200).json({ status: 200, data: booking });
  } catch (err) {
    console.error("Get Booking Error:", err);
    return res
      .status(500)
      .json({ status: 500, message: "Server error fetching booking" });
  }
};

const UsergetMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId })
      .populate("rooms.room", "roomNumber roomType images")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const booking = await Booking.findById(id);
    if (!booking)
      return res
        .status(404)
        .json({ status: 404, message: "Booking not found" });

    // Prevent illegal status transitions if needed
    Object.assign(booking, updates);
    await booking.save();

    return res
      .status(200)
      .json({ status: 200, message: "Booking updated", data: booking });
  } catch (err) {
    console.error("Update Booking Error:", err);
    return res
      .status(500)
      .json({ status: 500, message: "Server error updating booking" });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Find booking first
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        status: 404,
        message: "Booking not found",
      });
    }

    // ✅ Free all rooms connected to this booking
    for (const r of booking.rooms) {
      await Room.findByIdAndUpdate(r.room, { new: true });
    }

    // ✅ Delete booking from DB
    await Booking.findByIdAndDelete(id);

    return res.status(200).json({
      status: 200,
      message: "Booking deleted successfully",
    });
  } catch (err) {
    console.error("Delete Booking Error:", err);
    return res.status(500).json({
      status: 500,
      message: "Server error deleting booking",
    });
  }
};

const checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking)
      return res
        .status(404)
        .json({ status: 404, message: "Booking not found" });

    if (booking.status === "checked_in") {
      return res
        .status(400)
        .json({ status: 400, message: "Already checked in" });
    }

    booking.status = "checked_in";
    await booking.save();

    // Optionally update Room availability / housekeeping
    for (const r of booking.rooms) {
      await Room.findByIdAndUpdate(r.room, { housekeepingStatus: "Dirty" });
    }

    return res
      .status(200)
      .json({ status: 200, message: "Checked in successfully", data: booking });
  } catch (err) {
    console.error("Checkin Error:", err);
    return res
      .status(500)
      .json({ status: 500, message: "Server error during check-in" });
  }
};

const checkOut = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id).populate("guest");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "checked_in") {
      return res.status(400).json({
        message: "Cannot check out if not checked in",
      });
    }

    booking.status = "checked_out";
    await booking.save();

    // ✅ UPDATE ROOM STATUS
    for (const r of booking.rooms) {
      await Room.findByIdAndUpdate(r.room, {
        housekeepingStatus: "Dirty",
      });
    }

    // ===============================
    // 🔥 TRACK STAY + REPEAT GUEST
    // ===============================
    if (booking.guest) {
      const guest = await Guest.findById(booking.guest._id);

      // ✅ ADD STAY HISTORY
      guest.stayHistory.push({
        booking: booking._id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        roomNumbers: booking.rooms.map((r) => r.roomNumber),
        amountPaid: booking.totalAmount,
      });

      // ✅ CLEAR CURRENT STAY
      guest.currentStay = null;

      // ✅ REPEAT GUEST LOGIC
      guest.totalStays = (guest.totalStays || 0) + 1;
      guest.lastStayDate = new Date();

      // ✅ LOYALTY POINTS
      guest.loyaltyPoints += Math.floor(booking.totalAmount / 100);

      // ✅ MEMBERSHIP AUTO UPDATE
      if (guest.loyaltyPoints > 5000) guest.membershipTier = "Platinum";
      else if (guest.loyaltyPoints > 2500) guest.membershipTier = "Gold";
      else if (guest.loyaltyPoints > 1000) guest.membershipTier = "Silver";

      await guest.save();
    }

    return res.status(200).json({
      status: 200,
      message: "Checked out + stay tracked",
      data: booking,
    });
  } catch (err) {
    console.error("Checkout Error:", err);
    return res.status(500).json({
      status: 500,
      message: "Server error during check-out",
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking)
      return res
        .status(404)
        .json({ status: 404, message: "Booking not found" });

    booking.status = "cancelled";
    booking.cancelledBy = req.adminId;
    booking.cancelledAt = new Date();
    booking.notes =
      (booking.notes || "") + `\nCancelled: ${reason || "No reason provided"}`;

    await booking.save();

    // Optionally free rooms
    for (const r of booking.rooms) {
      await Room.findByIdAndUpdate(r.room, {});
    }

    return res
      .status(200)
      .json({ status: 200, message: "Booking cancelled", data: booking });
  } catch (err) {
    console.error("Cancel Booking Error:", err);
    return res
      .status(500)
      .json({ status: 500, message: "Server error cancelling booking" });
  }
};

// Calendar endpoint: returns bookings overlapping the date range
const getCalendar = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        status: 400,
        message: "start and end are required (YYYY-MM-DD)",
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const bookings = await Booking.find({
      status: { $ne: "cancelled" },

      $or: [
        {
          checkIn: { $lte: endDate },
          checkOut: { $gte: startDate },
        },
        {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      ],
    })
      .populate("rooms.room", "roomNumber roomType")
      .select(
        "bookingNumber guestName checkIn checkOut rooms status createdAt",
      );

    return res.status(200).json({
      status: 200,
      message: "Calendar bookings fetched",
      data: bookings,
    });
  } catch (err) {
    console.error("Calendar Error:", err);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching calendar",
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  checkIn,
  checkOut,
  cancelBooking,
  getCalendar,
  UsergetMyBookings,
};
