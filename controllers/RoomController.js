const Room = require("../models/Room");

// 🟢 Create Room
const createRoom = async (req, res) => {
  try {
    const roomData = req.body;
    roomData.createdBy = req.adminId;

    const existingRoom = await Room.findOne({ roomNumber: roomData.roomNumber });
    if (existingRoom) {
      return res.status(400).json({ status: 400, message: "Room number already exists" });
    }

    const room = await Room.create(roomData);
    res.status(201).json({ status: 201, message: "Room created successfully", data: room });
  } catch (error) {
    console.error("Create Room Error:", error);
    res.status(500).json({ status: 500, message: "Server error creating room" });
  }
};

// 🟡 Get Rooms with Pagination + Filters
const getRooms = async (req, res) => {
  try {
    const {
      search = "",
      type = "",
      isAvailable,
      page = 1,
      limit = 20
    } = req.query;

    const q = {};

    // ✅ Search (room number or type)
    if (search) {
      q.$or = [
        { roomNumber: { $regex: search, $options: "i" } },
        { roomType: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ Room Type filter
    if (type) q.roomType = type;

    // ✅ Availability filter
    if (isAvailable === "true") q.isAvailable = true;
    if (isAvailable === "false") q.isAvailable = false;

    // ✅ Pagination
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const [total, rooms] = await Promise.all([
      Room.countDocuments(q),
      Room.find(q)
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
    return res.status(500).json({ status: 500, message: "Server error fetching rooms" });
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
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) return res.status(404).json({ status: 404, message: "Room not found" });

    res.status(200).json({ status: 200, message: "Room updated successfully", data: room });
  } catch (error) {
    console.error("Update Room Error:", error);
    res.status(500).json({ status: 500, message: "Server error updating room" });
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
    const { isAvailable, housekeepingStatus } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ status: 404, message: "Room not found" });

    if (isAvailable !== undefined) room.isAvailable = isAvailable;
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
  updateRoomStatus,
};
