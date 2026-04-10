const Booking = require("../models/Booking");
const Room = require("../models/Room");

const getDashboardData = async (req, res) => {
  try {
    const today = new Date();

    // 🔹 Start & End of Today
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    /* ========== TODAY CHECK-INS =============== */
    const todayCheckIns = await Booking.find({
      checkIn: { $gte: start, $lte: end },
      status: { $in: ["confirmed", "checked_in"] },
    }).populate("rooms.room", "roomNumber");

    /* ========= TODAY CHECK-OUTS =========== */
    const todayCheckOuts = await Booking.find({
      checkOut: { $gte: start, $lte: end },
      status: { $in: ["checked_in", "checked_out"] },
    }).populate("rooms.room", "roomNumber");

    /* ======== AVAILABLE ROOMS ========== */
    const totalRooms = await Room.countDocuments();

    const occupiedRooms = await Booking.find({
      status: { $in: ["confirmed", "checked_in"] },
    });

    const occupiedRoomIds = occupiedRooms.flatMap((b) =>
      b.rooms.map((r) => r.room.toString())
    );

    const availableRooms = await Room.countDocuments({
      _id: { $nin: occupiedRoomIds },
      housekeepingStatus: "Clean", // only clean rooms
    });

    /* ======= DAILY REVENUE ========== */
    const todayBookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
      status: { $ne: "cancelled" },
    });

    const dailyRevenue = todayBookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );

    /* ========== OCCUPANCY RATE ============= */
    const occupancyRate =
      totalRooms === 0
        ? 0
        : ((occupiedRoomIds.length / totalRooms) * 100).toFixed(2);

    /* ======= FINAL RESPONSE ============== */
    res.status(200).json({
      status: 200,

      checkIns: todayCheckIns,
      checkOuts: todayCheckOuts,

      stats: {
        totalRooms,
        availableRooms,
        occupiedRooms: occupiedRoomIds.length,
        occupancyRate: `${occupancyRate}%`,
        dailyRevenue,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      status: 500,
      message: "Error fetching dashboard data",
    });
  }
};

module.exports = {
  getDashboardData,
};