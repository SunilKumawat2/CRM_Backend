const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Middlewares
const auth = require("../middleware/auth");
const permissions = require("../middleware/permissions");

// Controllers
const Inquiries_Controller = require("../controllers/Inquiries_Controllers");
const statusController = require("../controllers/statusController");
const adminLoginController = require("../controllers/Admin_Login_Controller");
const roleController = require("../controllers/RoleController");
const CollectionController = require("../controllers/Collection_Controller"); // ✅ New Controller Import
const LeadController = require("../controllers/Lead_Controller");
const CategoryController = require("../controllers/Category_Controller"); // ✅ New Controller Import
const RoomController = require("../controllers/RoomController"); // ✅ New Controller Import
const BookingController = require("../controllers/BookingController");
const GuestController = require("../controllers/GuestController");

// -------------------- Multer setup --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/photos"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// -------------------- Inquiry Routes --------------------
router.post("/create-inquiries", auth, Inquiries_Controller.CreateInquiries);
router.get("/get-inquiries", auth, Inquiries_Controller.GetInquiriesList);
router.get(
  "/get-inquiries-by-status/:status",
  auth,
  Inquiries_Controller.GetInquiriesByStatus
);

// -------------------- Status Routes --------------------
router.post("/create-status", auth, statusController.createStatus);
router.get("/get-status", auth, statusController.getStatuses);

// -------------------- Admin Routes --------------------
// 1️⃣ Register Admin (only super admin can create future admins)
router.post("/admin-register", auth, adminLoginController.registerAdmin);

// 2️⃣ Admin Login
router.post("/admin-login", adminLoginController.loginAdmin);

// 3️⃣ Get Admin Profile
router.get("/admin-profile", auth, adminLoginController.getAdminProfile);

// 4️⃣ Update Admin Profile (with profile image upload)
router.put(
  "/admin-profile",
  auth,
  upload.single("profileImage"),
  adminLoginController.updateAdminProfile
);

// 5️⃣ Get all admins (super admin only)
router.get("/admin-list", auth, adminLoginController.getAllAdmins);

// 6️⃣ Delete admin (super admin only)
router.delete("/admin-delete/:id", auth, adminLoginController.deleteAdmin);

// -------------------- Role Routes --------------------
// Create Role (requires "role_create" permission)
router.post("/create-role", auth, permissions("role_create"), roleController.createRole);

// Get Roles (requires "role_view" permission)
router.get("/get-roles", auth, permissions("role_view"), roleController.getRoles);

// Delete Role (requires "role_delete" permission)
router.delete("/delete-role/:id", auth, permissions("role_delete"), roleController.deleteRole);

router.put("/update-role/:id", auth, permissions("role_edit"), roleController.updateRole);

// Get Collections
router.get("/get-collections", auth, permissions("collection_view"), CollectionController.GetCollectionsList);

// Create / Update / Installment
router.post("/create-collection", auth, permissions("collection_create"), CollectionController.CreateCollection);
router.put("/update-collection/:id", auth, permissions("collection_update"), CollectionController.UpdateCollection);
router.put("/update-collection-installment/:id", auth, permissions("collection_update"), CollectionController.UpdateCollectionInstallment);

// Delete Collection
router.delete("/delete-collection/:id", auth, permissions("collection_delete"), CollectionController.DeleteCollection);

router.get("/collection-installments/:id", auth,
  CollectionController.GetInstallmentHistory);

// Dashboard & Chart APIs
router.get("/dashboard-summary", auth, permissions("collection_view"), CollectionController.GetDashboardSummary);
router.get("/chart/loan-amount", auth, permissions("collection_view"), CollectionController.GetYearlyLoanAmountChart);
router.get("/chart/open-close", auth, permissions("collection_view"), CollectionController.GetYearlyOpenCloseChart);



// router.get(
//   "/get-collections-by-status/:status",
//   auth,
//   permissions("collection_view"),
//   CollectionController.GetCollectionsByStatus
// );

router.post("/create-lead", auth, permissions("lead_create"), LeadController.createLead);
router.get("/get-leads", auth, permissions("lead_view"), LeadController.getLeads);

// -------------------- Category Routes --------------------
router.post("/create-category", auth, permissions("category_create"), CategoryController.CreateCategory);
router.get("/get-categories", auth, permissions("category_view"), CategoryController.GetCategoriesList);

// <--------- rooms Routes --------------------->
router.post("/create-room", auth, permissions("room_create"), RoomController.createRoom);
router.get("/get-rooms", auth, permissions("room_view"), RoomController.getRooms);
router.get("/get-room/:id", auth, permissions("room_view"), RoomController.getRoomById);
router.put("/update-room/:id", auth, permissions("room_edit"), RoomController.updateRoom);
router.delete("/delete-room/:id", auth, permissions("room_delete"), RoomController.deleteRoom);

// Update Room Status
router.patch("/update-room-status/:id", auth, permissions("room_edit"), RoomController.updateRoomStatus);


// <--------- Booking / Reservation Routes --------------------->
router.post("/create-booking", auth, permissions("booking_create"), BookingController.createBooking);
router.get("/get-bookings", auth, permissions("booking_view"), BookingController.getBookings);
router.get("/get-booking/:id", auth, permissions("booking_view"), BookingController.getBookingById);
router.put("/update-booking/:id", auth, permissions("booking_edit"), BookingController.updateBooking);

// Check-in
router.post("/checkin/:id", auth, permissions("booking_checkin"), BookingController.checkIn);

// Check-out
router.post("/checkout/:id", auth, permissions("booking_checkout"), BookingController.checkOut);

// Cancel (mark booking cancelled)
router.post("/cancel-booking/:id", auth, permissions("booking_delete"), BookingController.cancelBooking);

// Calendar (bookings overlapping the range)
router.get("/bookings/calendar", auth, permissions("booking_view"), BookingController.getCalendar);

// <--------- Guest Management Routes --------------------->
router.post("/create-guest", auth, permissions("guest_create"), upload.single("idDocument"), GuestController.createGuest);

router.get("/get-guests", auth, permissions("guest_view"), GuestController.getGuests);

router.get("/get-guest/:id", auth, permissions("guest_view"), GuestController.getGuestById);

router.put("/update-guest/:id", auth, permissions("guest_edit"), upload.single("idDocument"), GuestController.updateGuest);

router.delete("/delete-guest/:id", auth, permissions("guest_delete"), GuestController.deleteGuest);

// Add stay history for guest (after checkout)
router.post("/guest/:guestId/add-stay", auth, permissions("guest_edit"), GuestController.addStayHistory);

// Update loyalty or rewards points
router.post("/guest/:id/update-loyalty", auth, permissions("guest_edit"), GuestController.updateLoyaltyPoints);

module.exports = router;
