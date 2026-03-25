const mongoose = require("mongoose");

/* ================= CART ITEM SCHEMA ================= */
const Reserve_Room_Schema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    quantity: { type: Number, default: 1 }, // usually 1 room, but flexible
    price: { type: Number, required: true }, // capture price at time of adding
  },
  { _id: false }
);

/* ================= CART SCHEMA ================= */
const Reserve_Schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // replace with your User model if exists
      required: true,
    },
    items: [Reserve_Room_Schema],
    totalPrice: { type: Number, default: 0 },
    isCheckedOut: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ================= METHODS ================= */
// Recalculate total price whenever items are added/removed
Reserve_Schema.methods.calculateTotal = function () {
  this.totalPrice = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return this.totalPrice;
};

module.exports = mongoose.model("reserve_room", Reserve_Schema);