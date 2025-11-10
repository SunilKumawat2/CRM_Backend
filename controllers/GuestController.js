// controllers/GuestController.js
const Guest = require("../models/Guest");

// ---------------- Helper ----------------
const uploadPath = "/uploads/photos/";

// ---------------- Controllers ----------------

// Create new guest
// ✅ Create New Guest
const createGuest = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      preferences,
      loyaltyPoints,
      membershipTier,
      idType,
      idNumber,
      notes,
    } = req.body;

    // ✅ Required field validation
    if (!fullName) {
      return res
        .status(400)
        .json({ status: 400, message: "Full name is required" });
    }

    // ✅ Ensure preferences is always an array of strings
    const finalPreferences = Array.isArray(preferences)
      ? preferences
      : typeof preferences === "string"
      ? [preferences] // if single string
      : [];

    // ✅ Build new guest object
    const newGuest = {
      fullName,
      email: email || "",
      phone: phone || "",
      address: address || "",
      preferences: finalPreferences,
      loyaltyPoints: loyaltyPoints ? Number(loyaltyPoints) : 0,
      membershipTier: membershipTier || "Standard",
      idType: idType || "",
      idNumber: idNumber || "",
      idDocumentUrl: req.file ? `${uploadPath}${req.file.filename}` : "",
      notes: notes || "",
      createdBy: req.adminId,
    };

    // ✅ Save to DB
    const guest = await Guest.create(newGuest);

    return res.status(201).json({
      status: 201,
      message: "Guest created successfully",
      data: guest,
    });
  } catch (err) {
    console.error("Create Guest Error:", err);
    return res
      .status(500)
      .json({ status: 500, message: "Server error creating guest" });
  }
};

// Fetch all guests
const getGuests = async (req, res) => {
  try {
    const { search, tier, page = 1, limit = 50 } = req.query;

    const q = {};

    // ✅ Search filter
    if (search) {
      q.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ Membership Tier Filter
    if (tier) q.membershipTier = tier;

    // ✅ Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    // ✅ Run total count + paginated query in parallel
    const [total, guests] = await Promise.all([
      Guest.countDocuments(q),
      Guest.find(q)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      status: 200,
      message: "Guests fetched successfully",
      data: guests,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });

  } catch (err) {
    console.error("Get Guests Error:", err);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching guests",
    });
  }
};


// Get guest by ID
const getGuestById = async (req, res) => {
  try {
    const { id } = req.params;
    const guest = await Guest.findById(id).populate("stayHistory.booking", "bookingNumber checkIn checkOut totalAmount");

    if (!guest) return res.status(404).json({ status: 404, message: "Guest not found" });

    return res.status(200).json({ status: 200, message: "Guest fetched successfully", data: guest });
  } catch (err) {
    console.error("Get Guest Error:", err);
    return res.status(500).json({ status: 500, message: "Server error fetching guest" });
  }
};

// Update guest info
const updateGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.file) {
      updates.idDocumentUrl = `${uploadPath}${req.file.filename}`;
    }

    const guest = await Guest.findByIdAndUpdate(id, updates, { new: true });
    if (!guest) return res.status(404).json({ status: 404, message: "Guest not found" });

    return res.status(200).json({ status: 200, message: "Guest updated successfully", data: guest });
  } catch (err) {
    console.error("Update Guest Error:", err);
    return res.status(500).json({ status: 500, message: "Server error updating guest" });
  }
};

// Delete guest
const deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const guest = await Guest.findByIdAndDelete(id);
    if (!guest) return res.status(404).json({ status: 404, message: "Guest not found" });

    return res.status(200).json({ status: 200, message: "Guest deleted successfully" });
  } catch (err) {
    console.error("Delete Guest Error:", err);
    return res.status(500).json({ status: 500, message: "Server error deleting guest" });
  }
};

// Add stay record
const addStayHistory = async (req, res) => {
  try {
    const { guestId } = req.params;
    const { booking, checkIn, checkOut, roomNumbers, amountPaid } = req.body;

    if (!booking || !checkIn || !checkOut) {
      return res.status(400).json({ status: 400, message: "Missing required stay history fields" });
    }

    const guest = await Guest.findById(guestId);
    if (!guest) return res.status(404).json({ status: 404, message: "Guest not found" });

    guest.stayHistory.push({ booking, checkIn, checkOut, roomNumbers, amountPaid });
    await guest.save();

    return res.status(200).json({ status: 200, message: "Stay history added successfully", data: guest });
  } catch (err) {
    console.error("Add Stay History Error:", err);
    return res.status(500).json({ status: 500, message: "Server error adding stay history" });
  }
};

// Update loyalty points
const updateLoyaltyPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { pointsToAdd } = req.body;

    const guest = await Guest.findById(id);
    if (!guest) return res.status(404).json({ status: 404, message: "Guest not found" });

    guest.loyaltyPoints += Number(pointsToAdd || 0);

    if (guest.loyaltyPoints > 5000) guest.membershipTier = "Platinum";
    else if (guest.loyaltyPoints > 2500) guest.membershipTier = "Gold";
    else if (guest.loyaltyPoints > 1000) guest.membershipTier = "Silver";

    await guest.save();

    return res.status(200).json({
      status: 200,
      message: `Loyalty points updated (${guest.loyaltyPoints})`,
      data: guest,
    });
  } catch (err) {
    console.error("Update Loyalty Error:", err);
    return res.status(500).json({ status: 500, message: "Server error updating loyalty points" });
  }
};

module.exports = {
  createGuest,
  getGuests,
  getGuestById,
  updateGuest,
  deleteGuest,
  addStayHistory,
  updateLoyaltyPoints,
};
