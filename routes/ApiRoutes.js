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
const CollectionController = require("../controllers/Collection_Controller"); 
const CategoryController = require("../controllers/Category_Controller"); // ✅ New Controller Import
const RoomController = require("../controllers/RoomController"); // ✅ New Controller Import
const BookingController = require("../controllers/BookingController");
const GuestController = require("../controllers/GuestController");
const HousekeepingController = require("../controllers/HousekeepingController");
const StaffAttendanceController = require("../controllers/StaffAttendanceController");
const FinanceController = require("../controllers/FinanceController");
const InventoryController = require("../controllers/InventoryController");
const ValetParkingController = require("../controllers/ValetParkingController");

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
router.get("/get-inquiries-by-status/:status",auth,Inquiries_Controller.GetInquiriesByStatus);

// -------------------- Status Routes --------------------
router.post("/create-status", auth, statusController.createStatus);
router.get("/get-status", auth, statusController.getStatuses);

// -------------------- Admin Routes --------------------
router.post("/admin-register", auth, adminLoginController.registerAdmin);
router.post("/admin-login", adminLoginController.loginAdmin);
router.get("/admin-profile", auth, adminLoginController.getAdminProfile);
router.put("/admin-profile",auth,upload.single("profileImage"),adminLoginController.updateAdminProfile);
router.get("/admin-list", auth, adminLoginController.getAllAdmins);
router.delete("/admin-delete/:id", auth, adminLoginController.deleteAdmin);

// -------------------- Role Routes -------------------->
router.post("/create-role", auth, permissions("role_create"), roleController.createRole);
router.get("/get-roles", auth, permissions("role_view"), roleController.getRoles);
router.delete("/delete-role/:id", auth, permissions("role_delete"), roleController.deleteRole);
router.put("/update-role/:id", auth, permissions("role_edit"), roleController.updateRole);

// <------------ Get Collections Routes-------------->
router.get("/get-collections", auth, permissions("collection_view"), CollectionController.GetCollectionsList);
router.post("/create-collection", auth, permissions("collection_create"), CollectionController.CreateCollection);
router.put("/update-collection/:id", auth, permissions("collection_update"), CollectionController.UpdateCollection);
router.put("/update-collection-installment/:id", auth, permissions("collection_update"), CollectionController.UpdateCollectionInstallment);
router.delete("/delete-collection/:id", auth, permissions("collection_delete"), CollectionController.DeleteCollection);
router.get("/collection-installments/:id", auth,CollectionController.GetInstallmentHistory);

//<------------ Dashboard & Chart APIs Routes -------------->
router.get("/dashboard-summary", auth, permissions("collection_view"), CollectionController.GetDashboardSummary);
router.get("/chart/loan-amount", auth, permissions("collection_view"), CollectionController.GetYearlyLoanAmountChart);
router.get("/chart/open-close", auth, permissions("collection_view"), CollectionController.GetYearlyOpenCloseChart);


// -------------------- Category Routes --------------------
router.post("/create-category", auth, permissions("category_create"), CategoryController.CreateCategory);
router.get("/get-categories", auth, permissions("category_view"), CategoryController.GetCategoriesList);

// <--------- rooms Routes --------------------->
router.post("/create-room", auth, permissions("room_create"), RoomController.createRoom);
router.get("/get-rooms", auth, permissions("room_view"), RoomController.getRooms);
router.get("/get-room/:id", auth, permissions("room_view"), RoomController.getRoomById);
router.put("/update-room/:id", auth, permissions("room_edit"), RoomController.updateRoom);
router.delete("/delete-room/:id", auth, permissions("room_delete"), RoomController.deleteRoom);
router.patch("/update-room-status/:id", auth, permissions("room_edit"), RoomController.updateRoomStatus);


// <--------- Booking / Reservation Routes --------------------->
router.post("/create-booking", auth, permissions("booking_create"), BookingController.createBooking);
router.get("/get-bookings", auth, permissions("booking_view"), BookingController.getBookings);
router.get("/get-booking/:id", auth, permissions("booking_view"), BookingController.getBookingById);
router.put("/update-booking/:id", auth, permissions("booking_edit"), BookingController.updateBooking);
 
//<--------  Check-in / Check-out Routes  ------------------> 
router.post("/checkin/:id", auth, permissions("booking_checkin"), BookingController.checkIn);
router.post("/checkout/:id", auth, permissions("booking_checkout"), BookingController.checkOut);

// <------Cancel (mark booking cancelled) / Calendar (bookings overlapping the range) routes---------->
router.post("/cancel-booking/:id", auth, permissions("booking_delete"), BookingController.cancelBooking);
router.get("/bookings/calendar", auth, permissions("booking_view"), BookingController.getCalendar);

// <--------- Guest Management Routes --------------------->
router.post("/create-guest", auth, permissions("guest_create"), upload.single("idDocument"), GuestController.createGuest);
router.get("/get-guests", auth, permissions("guest_view"), GuestController.getGuests);
router.get("/get-guest/:id", auth, permissions("guest_view"), GuestController.getGuestById);
router.put("/update-guest/:id", auth, permissions("guest_edit"), upload.single("idDocument"), GuestController.updateGuest);
router.delete("/delete-guest/:id", auth, permissions("guest_delete"), GuestController.deleteGuest);
router.post("/guest/:guestId/add-stay", auth, permissions("guest_edit"), GuestController.addStayHistory);
router.post("/guest/:id/update-loyalty", auth, permissions("guest_edit"), GuestController.updateLoyaltyPoints);


// <--------- Housekeeping Management Routes --------------------->
router.post("/create-housekeeping", auth, permissions("housekeeping_create"), HousekeepingController.createHousekeepingTask);
router.get("/get-housekeeping", auth, permissions("housekeeping_view"), HousekeepingController.getHousekeepingTasks);
router.put("/update-housekeeping/:id", auth, permissions("housekeeping_edit"), HousekeepingController.updateHousekeepingTask);
router.post("/verify-cleaning/:id", auth, permissions("housekeeping_edit"), HousekeepingController.verifyCleaning);
router.delete("/delete-housekeeping/:id", auth, permissions("housekeeping_delete"), HousekeepingController.deleteHousekeepingTask);


// <--------- Staff Attendance Routes --------------------->
router.post("/create-staff-attendance",auth,permissions("attendance_create"),StaffAttendanceController.createStaffAttendance);
router.get("/get-staff-attendance",auth,permissions("attendance_view"),StaffAttendanceController.getStaffAttendance);
router.put("/update-staff-attendance/:id",auth,permissions("attendance_edit"),StaffAttendanceController.updateStaffAttendance);
router.post("/verify-staff-attendance/:id",auth,permissions("attendance_edit"),StaffAttendanceController.verifyStaffAttendance);
router.delete("/delete-staff-attendance/:id",auth,permissions("attendance_delete"),StaffAttendanceController.deleteStaffAttendance);
router.get("/staff-attendance-summary",auth,permissions("attendance_view"),StaffAttendanceController.getAttendanceSummary);


//<------------- Finance / Billing ------------------------>
router.post("/create-invoice", auth, permissions("invoice_create"), FinanceController.createInvoice);
router.get("/get-invoices", auth, permissions("invoice_view"), FinanceController.getInvoices);
router.get("/get-invoice/:id", auth, permissions("invoice_view"), FinanceController.getInvoiceById);
router.post("/create-payment", auth, permissions("payment_create"), FinanceController.createPayment);
router.post("/create-expense", auth, permissions("expense_create"), FinanceController.createExpense);
router.get("/financial-report", auth, permissions("finance_view"), FinanceController.getFinancialReport);

//<----------------- Inventory & Procurement -------------------->
router.post("/create-stock-item", auth, permissions("inventory_create"), InventoryController.createStockItem);
router.get("/get-stock-items", auth, permissions("inventory_view"), InventoryController.getStockItems);
router.put("/update-stock-quantity/:id", auth, permissions("inventory_edit"), InventoryController.updateStockQuantity);
router.post("/create-supplier", auth, permissions("supplier_create"), InventoryController.createSupplier);
router.post("/create-po", auth, permissions("po_create"), InventoryController.createPurchaseOrder);
router.post("/receive-po/:id", auth, permissions("po_receive"), InventoryController.receivePurchaseOrder);

// <--------- Valet Parking Routes --------------------->
router.post("/create-valet-parking",auth, permissions("valet_create"),ValetParkingController.createParkingSlip)
router.get("/get-valet-parking",auth, permissions("valet_view"),ValetParkingController.getParkingSlips)
router.put("/update-valet-parking/:id",auth,permissions("valet_update"),ValetParkingController.updateParkingStatus)
router.delete("/delete-valet-parking/:id",auth,permissions("valet_delete"),ValetParkingController.deleteParkingSlip)
module.exports = router;
