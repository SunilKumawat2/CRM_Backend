const RoomType = require("../models/RoomType");

// ✅ Create
const createRoomType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 400,
        message: "Name is required",
      });
    }

    const exists = await RoomType.findOne({ name });
    if (exists) {
      return res.status(400).json({
        status: 400,
        message: "Room type already exists",
      });
    }

    const roomType = await RoomType.create({
      ...req.body,
      createdBy: req.adminId,
    });

    return res.status(201).json({
      status: 201,
      message: "Room type created successfully",
      data: roomType,
    });
  } catch (error) {
    console.error("Create RoomType Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error creating room type",
    });
  }
};

// ✅ Get (Paginated + Search)
const getRoomTypes = async (req, res) => {
  try {
    let { page = 1, limit = 20, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [total, roomTypes] = await Promise.all([
      RoomType.countDocuments(query),
      RoomType.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.status(200).json({
      status: 200,
      message: "Room types fetched successfully",
      data: roomTypes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get RoomTypes Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching room types",
    });
  }
};

// ✅ Update
const updateRoomType = async (req, res) => {
  try {
    const { id } = req.params;

    const roomType = await RoomType.findById(id);
    if (!roomType) {
      return res.status(404).json({
        status: 404,
        message: "Room type not found",
      });
    }

    Object.keys(req.body).forEach((key) => {
      roomType[key] = req.body[key];
    });

    await roomType.save();

    return res.status(200).json({
      status: 200,
      message: "Room type updated successfully",
      data: roomType,
    });
  } catch (error) {
    console.error("Update RoomType Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error updating room type",
    });
  }
};

// ✅ Delete
const deleteRoomType = async (req, res) => {
  try {
    const { id } = req.params;

    const roomType = await RoomType.findByIdAndDelete(id);
    if (!roomType) {
      return res.status(404).json({
        status: 404,
        message: "Room type not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Room type deleted successfully",
    });
  } catch (error) {
    console.error("Delete RoomType Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error deleting room type",
    });
  }
};

module.exports = {
  createRoomType,
  getRoomTypes,
  updateRoomType,
  deleteRoomType,
};