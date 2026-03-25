const Reserve = require("../models/Reserve_Rooms");
const Room = require("../models/Room");

/* ================= Add Room to Reserve ================= */
const Add_Reserve_Room = async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, quantity = 1 } = req.body;
    const userId = req.userId; // or req.adminId if admin context

    // 1️⃣ Validate room
    const room = await Room.findById(roomId);
    if (!room || !room.isAvailable) {
      return res.status(404).json({ status: 404, message: "Room not available" });
    }

    // 2️⃣ Get existing cart
    let cart = await Reserve.findOne({ user: userId, isCheckedOut: false });
    if (!cart) {
      cart = new Reserve({ user: userId, items: [] });
    }

    // 3️⃣ Check if room already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.room.toString() === roomId &&
        new Date(item.checkInDate).toISOString() === new Date(checkInDate).toISOString() &&
        new Date(item.checkOutDate).toISOString() === new Date(checkOutDate).toISOString()
    );

    if (existingItemIndex > -1) {
      // Increase quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        room: room._id,
        checkInDate,
        checkOutDate,
        quantity,
        price: room.finalPrice,
      });
    }

    // 4️⃣ Recalculate total price
    cart.calculateTotal();
    await cart.save();

    return res.status(200).json({ status: 200, message: "Room added to cart", data: cart });
  } catch (error) {
    console.error("Add to Reserve Error:", error);
    return res.status(500).json({ status: 500, message: "Server error adding to cart" });
  }
};

/* ================= Get User Reserve ================= */
const Get_Reserve_Room = async (req, res) => {
  try {
    const userId = req.userId; // or req.adminId
    const cart = await Reserve.findOne({ user: userId, isCheckedOut: false }).populate({
      path: "items.room",
      select: "roomNumber roomType roomView baseRate discountedPrice finalPrice images",
    });

    if (!cart) {
      return res.status(200).json({ status: 200, message: "Reserve is empty", data: [] });
    }

    return res.status(200).json({ status: 200, message: "Reserve fetched successfully", data: cart });
  } catch (error) {
    console.error("Get Reserve Error:", error);
    return res.status(500).json({ status: 500, message: "Server error fetching cart" });
  }
};

/* ================= Update Reserve Item ================= */
const Update_Reserve_Room = async (req, res) => {
  try {
    const { itemId, quantity, checkInDate, checkOutDate } = req.body;
    const userId = req.userId;

    const cart = await Reserve.findOne({ user: userId, isCheckedOut: false });
    if (!cart) return res.status(404).json({ status: 404, message: "Reserve not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ status: 404, message: "Reserve item not found" });

    if (quantity !== undefined) item.quantity = quantity;
    if (checkInDate) item.checkInDate = checkInDate;
    if (checkOutDate) item.checkOutDate = checkOutDate;

    cart.calculateTotal();
    await cart.save();

    return res.status(200).json({ status: 200, message: "Reserve item updated", data: cart });
  } catch (error) {
    console.error("Update Reserve Item Error:", error);
    return res.status(500).json({ status: 500, message: "Server error updating cart item" });
  }
};

/* ================= Remove Room from Reserve ================= */
const Remove_Reserve_Room = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.userId;

    const cart = await Reserve.findOne({ user: userId, isCheckedOut: false });
    if (!cart) return res.status(404).json({ status: 404, message: "Reserve not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ status: 404, message: "Reserve item not found" });

    item.remove();
    cart.calculateTotal();
    await cart.save();

    return res.status(200).json({ status: 200, message: "Reserve item removed", data: cart });
  } catch (error) {
    console.error("Remove Reserve Item Error:", error);
    return res.status(500).json({ status: 500, message: "Server error removing cart item" });
  }
};

module.exports = {
  Add_Reserve_Room,
  Get_Reserve_Room,
  Update_Reserve_Room,
  Remove_Reserve_Room,
};