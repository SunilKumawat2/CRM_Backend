const Booking = require("../models/Booking");
const Room = require("../models/Room");

/* ======= DAILY REVENUE REPORT =========== */
const getDailyRevenue = async (req, res) => {
  try {
    const { date } = req.query;

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
      status: { $ne: "cancelled" },
    });

    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );

    res.status(200).json({
      status: 200,
      date,
      totalBookings: bookings.length,
      totalRevenue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching daily revenue" });
  }
};

/* ======== MONTHLY REVENUE REPORT ======================= */
const getMonthlyRevenue = async (req, res) => {
  try {
    const { year } = req.query;

    const data = await Booking.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          totalRevenue: { $sum: "$totalAmount" },
          totalBookings: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    res.status(200).json({
      status: 200,
      year,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching monthly report" });
  }
};

/* ======== OCCUPANCY REPORT =================== */
const getOccupancyReport = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();

    const occupiedRooms = await Booking.countDocuments({
      status: { $in: ["confirmed", "checked_in"] },
    });

    const occupancyRate =
      totalRooms === 0
        ? 0
        : ((occupiedRooms / totalRooms) * 100).toFixed(2);

    res.status(200).json({
      status: 200,
      totalRooms,
      occupiedRooms,
      occupancyRate: `${occupancyRate}%`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching occupancy report" });
  }
};

/* =========== BOOKING REPORT ============== */
const getBookingReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const bookings = await Booking.find(query)
      .populate("user", "name email")
      .populate("rooms.room", "roomNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 200,
      total: bookings.length,
      data: bookings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching booking report" });
  }
};

module.exports = {
  getDailyRevenue,
  getMonthlyRevenue,
  getOccupancyReport,
  getBookingReport,
};