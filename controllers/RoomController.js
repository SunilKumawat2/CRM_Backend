const Room = require("../models/Room");
const Booking = require("../models/Booking")
// 🟢 Create Room
const createRoom = async (req, res) => {
  try {
    const data = req.body;
    const exists = await Room.findOne({ roomNumber: data.roomNumber });
    if (exists) {
      return res.status(400).json({ status: 400, message: "Room number already exists" });
    }

    const images = req.files?.map(file => file.filename) || [];
    const room = await Room.create({ ...data, images, createdBy: req.adminId });

    return res.status(201).json({ status: 201, message: "Room created successfully", data: room });
  } catch (error) {
    console.error("Create Room Error:", error);
    return res.status(500).json({ status: 500, message: "Server error creating room" });
  }
};

// 🟡 Get Rooms with Pagination + Date-wise Availability
const getRooms = async (req, res) => {
  try {
    const {
      search = "",
      type = "",
      checkIn,
      checkOut,
      page = 1,
      limit = 20,
    } = req.query;

   const query = {};

// 🔐 DATA ACCESS CONTROL
if (!req.isSuperAdmin) {
  query.createdBy = req.adminId;
}
    // 🔹 Search Filter (ONLY roomNumber)
    if (search) {
      query.roomNumber = { $regex: search, $options: "i" };
    }

    // 🔹 Filter by Room Type (ObjectId)
    if (type) {
      query.roomType = type;
    }

    // 🔹 Date-wise Availability (existing bookings)
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);

      const overlappingBookings = await Booking.find({
        status: { $in: ["confirmed", "checked_in"] },
        "rooms.room": { $exists: true },
        checkIn: { $lt: end },
        checkOut: { $gt: start },
      }).select("rooms");

      const bookedRoomIds = overlappingBookings.flatMap((b) =>
        b.rooms.map((r) => r.room.toString())
      );

      if (bookedRoomIds.length > 0) {
        query._id = { $nin: bookedRoomIds };
      }
    }

    // 🔹 Only include rooms that are available and not in maintenance
    query.housekeepingStatus = "Clean"; // Only clean rooms
    query.isAvailable = true;            // Only rooms ready for booking

    // 🔹 Pagination
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const [total, rooms] = await Promise.all([
      Room.countDocuments(query),

      Room.find(query)
        .populate("roomType", "name")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
    ]);

    return res.status(200).json({
      status: 200,
      message: "Rooms fetched successfully",
      data: rooms,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get Rooms Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching rooms",
    });
  }
};
// 🟡 Get Rooms with Pagination + Date-wise Availability
// const getRooms = async (req, res) => {
//   try {
//     const {
//       search = "",
//       type = "",
//       checkIn,
//       checkOut,
//       page = 1,
//       limit = 20,
//     } = req.query;

//     const query = {};

//     // 🔹 Search Filter (ONLY roomNumber)
//     if (search) {
//       query.roomNumber = { $regex: search, $options: "i" };
//     }

//     // 🔹 Filter by Room Type (ObjectId)
//     if (type) {
//       query.roomType = type;
//     }

//     // 🔹 Date-wise Availability
//     if (checkIn && checkOut) {
//       const start = new Date(checkIn);
//       const end = new Date(checkOut);

//       const overlappingBookings = await Booking.find({
//         status: { $in: ["confirmed", "checked_in"] },
//         "rooms.room": { $exists: true },
//         checkIn: { $lt: end },
//         checkOut: { $gt: start },
//       }).select("rooms");

//       const bookedRoomIds = overlappingBookings.flatMap((b) =>
//         b.rooms.map((r) => r.room.toString())
//       );

//       if (bookedRoomIds.length > 0) {
//         query._id = { $nin: bookedRoomIds };
//       }
//     }

//     // 🔹 Exclude maintenance rooms
//     query.housekeepingStatus = { $ne: "In Maintenance" };

//     // 🔹 Pagination
//     const skip =
//       (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

//     const [total, rooms] = await Promise.all([
//       Room.countDocuments(query),

//       Room.find(query)
//         .populate("roomType", "name") // ✅ THIS IS THE IMPORTANT FIX
//         .populate("createdBy", "name email")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit)),
//     ]);

//     return res.status(200).json({
//       status: 200,
//       message: "Rooms fetched successfully",
//       data: rooms,
//       total,
//       page: parseInt(page),
//       limit: parseInt(limit),
//       totalPages: Math.ceil(total / limit),
//     });
//   } catch (error) {
//     console.error("Get Rooms Error:", error);
//     return res.status(500).json({
//       status: 500,
//       message: "Server error fetching rooms",
//     });
//   }
// };

// 🟡 Get Rooms with Pagination + Filters
const getRelatedRooms = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the current room
    const currentRoom = await Room.findById(id);
    if (!currentRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Find related rooms
    const relatedRooms = await Room.find({
      _id: { $ne: id }, // exclude current room
      roomType: currentRoom.roomType, // same type
      roomView: currentRoom.roomView,
    }).limit(5); // limit to 5 rooms

    res.status(200).json({ relatedRooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching related rooms" });
  }
};

// 🟢 Get Rooms for Users (with filters)
const getUserRooms = async (req, res) => {
  try {
    const {
      search = "",
      roomType = "",
      floorLevel = "",
      roomView = "",
      minAdults,
      maxAdults,

      /* 💰 PRICE FILTER */
      minBaseRate,
      maxBaseRate,

      amenities = "",
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    /* 🔍 Search by room number */
    if (search.trim()) {
      query.roomNumber = { $regex: search, $options: "i" };
    }

    /* 🛏 Room Type */
    if (roomType.trim()) {
      query.roomType = roomType;
    }

    /* 🏢 Floor Level */
    if (floorLevel.trim()) {
      query.floorLevel = floorLevel;
    }

    /* 🌆 Room View */
    if (roomView.trim()) {
      query.roomView = roomView;
    }

    /* 👨‍👩‍👧 Occupancy */
    if (minAdults || maxAdults) {
      query.maxAdults = {};
      if (minAdults) query.maxAdults.$gte = Number(minAdults);
      if (maxAdults) query.maxAdults.$lte = Number(maxAdults);
    }

    /* 💰 Base Rate Filter */
    if (minBaseRate || maxBaseRate) {
      query.baseRate = {};
      if (minBaseRate) query.baseRate.$gte = Number(minBaseRate);
      if (maxBaseRate) query.baseRate.$lte = Number(maxBaseRate);
    }

    /* 🧾 Amenities */
    if (amenities.trim()) {
      const amenityArray = amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      if (amenityArray.length) {
        query.amenities = { $all: amenityArray };
      }
    }

    /* 📄 Pagination */
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const [rooms, total] = await Promise.all([
      Room.find(query)
        .select("-createdBy -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Room.countDocuments(query),
    ]);

    return res.status(200).json({
      status: 200,
      message: "Rooms fetched successfully",
      data: rooms,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get User Rooms Error:", error);
    return res
      .status(500)
      .json({ status: 500, message: "Server error fetching rooms" });
  }
};

// 🟢 Get Single Room Details (User) WITH BOOKED DATES
const getUserRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔎 Validate Mongo ObjectId
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid room ID",
      });
    }

    const room = await Room.findById(id).select("-createdBy -__v");

    if (!room) {
      return res.status(404).json({
        status: 404,
        message: "Room not found",
      });
    }

    // 💰 Final price
    const finalPrice =
      room.discountedPrice > 0
        ? room.baseRate - room.discountedPrice
        : room.baseRate;

    // 🔥 IMPORTANT: get all bookings for this room
    const bookings = await Booking.find({
      "rooms.room": id, // 👈 your schema
      status: { $ne: "cancelled" },
    }).select("checkIn checkOut");

    // 👉 Format dates for frontend
    const bookedDates = bookings.map((b) => ({
      checkIn: b.checkIn,
      checkOut: b.checkOut,
    }));

    return res.status(200).json({
      status: 200,
      message: "Room details fetched successfully",
      data: {
        ...room.toObject(),
        finalPrice,
        bookedDates, // 🔥 MAIN FEATURE
      },
    });
  } catch (error) {
    console.error("Get Room By ID Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching room details",
    });
  }
};

// 🟣 Get Single Room
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ status: 404, message: "Room not found" });
    res.status(200).json({ status: 200, data: room });
  } catch (error) {
    console.error("Get Room Error:", error);
    res.status(500).json({ status: 500, message: "Server error fetching room" });
  }
};

// 🟠 Update Room
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    // 1️⃣ Find room
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        status: 404,
        message: "Room not found",
      });
    }

    // 2️⃣ Prevent duplicate room number
    if (
      payload.roomNumber &&
      payload.roomNumber !== room.roomNumber
    ) {
      const exists = await Room.findOne({
        roomNumber: payload.roomNumber,
      });

      if (exists) {
        return res.status(400).json({
          status: 400,
          message: "Room number already exists",
        });
      }
    }

    // 3️⃣ Fields allowed to update
    const allowedFields = [
      "roomNumber",
      "roomType",
      "roomView",
      "floorLevel",
      "nearElevator",

      "baseRate",
      "discountedPrice",
      "payAtHotel",
      "freeCancellation",
      "refundable",

      "maxAdults",
      "maxChildren",
      "maxOccupancy",
      "extraBedAllowed",

      "bedType",
      "numberOfBeds",
      "hasLivingArea",
      "hasBalcony",

      "bathtub",
      "jacuzzi",
      "hairDryer",

      "wheelchairAccessible",
      "groundFloor",
      "seniorFriendly",

      "smokingAllowed",
      "earlyCheckin",
      "lateCheckout",
      "hourlyStay",
      "longStayFriendly",

      "rating",
      "tags",
      "amenities",
      "images",

      "seasonalRates",
      "description",
      "housekeepingStatus",
    ];

    // 4️⃣ Assign only allowed fields
    allowedFields.forEach((field) => {
      if (payload[field] !== undefined) {
        room[field] = payload[field];
      }
    });

    // 5️⃣ Save
    await room.save();

    res.status(200).json({
      status: 200,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    console.error("Update Room Error:", error);
    res.status(500).json({
      status: 500,
      message: "Server error updating room",
    });
  }
};


// 🔴 Delete Room
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ status: 404, message: "Room not found" });

    res.status(200).json({ status: 200, message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete Room Error:", error);
    res.status(500).json({ status: 500, message: "Server error deleting room" });
  }
};

// 🟢 Update Room Availability or Housekeeping Status
const updateRoomStatus = async (req, res) => {
  try {
    const { housekeepingStatus } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ status: 404, message: "Room not found" });

    if (housekeepingStatus) room.housekeepingStatus = housekeepingStatus;

    await room.save();
    res.status(200).json({ status: 200, message: "Room status updated", data: room });
  } catch (error) {
    console.error("Update Room Status Error:", error);
    res.status(500).json({ status: 500, message: "Server error updating room status" });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getUserRooms,
  updateRoomStatus,
  getUserRoomById,
  getRelatedRooms
};
