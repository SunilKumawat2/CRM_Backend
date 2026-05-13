const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Middlewares
const auth = require("../middleware/auth");
const user_auth = require("../middleware/userAuth");
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
const EventPackageController = require("../controllers/EventPackageController");
const CateringController = require("../controllers/CateringController");
const GuestRequestController = require("../controllers/GuestRequestController");
const FeedbackController = require("../controllers/FeedbackController");
const MaintenanceController = require("../controllers/MaintenanceController");
const LostFoundController = require("../controllers/LostFoundController");
const AssetController = require("../controllers/AssetController");
const UserController = require("../controllers/UserController");
const NotificationController = require("../controllers/NotificationController");
const Reserve_Room_Controller = require("../controllers/Reserve_Room_Controller");
const PaymentController = require("../controllers/PaymentController");
const userAuth = require("../middleware/userAuth");
const HomeBannerController = require("../controllers/HomeBannerController");
const RoomType_Controller = require("../controllers/RoomType_Controller");
const ReportController = require("../controllers/ReportController");
const DashboardController = require("../controllers/DashboardController");
const staffController = require("../controllers/StaffController");
const Shifts_Controller = require("../controllers/Shifts_Controller");
const CompanyPolicyController = require("../controllers/CompanyPolicyController");
const WeeklyOffController = require("../controllers/WeeklyOffController");
const HolidayController = require("../controllers/HolidayController");
const PayrollController = require("../controllers/PayrollController");
const CompanyController = require("../controllers/CompanyController");

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
router.get("/get-inquiries-by-status/:status", auth, Inquiries_Controller.GetInquiriesByStatus);

// -------------------- Status Routes --------------------
router.post("/create-status", auth, statusController.createStatus);
router.get("/get-status", auth, statusController.getStatuses);

// -------------------- Admin Routes --------------------
router.post("/admin-register", auth, adminLoginController.registerAdmin);
router.post("/admin-login", adminLoginController.loginAdmin);
router.get("/admin-profile", auth, adminLoginController.getAdminProfile);
router.put("/admin-profile", auth, upload.single("profileImage"), adminLoginController.updateAdminProfile);
router.get("/admin-list", auth, permissions("admins_view"), adminLoginController.getAllAdmins);
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
router.get("/collection-installments/:id", auth, CollectionController.GetInstallmentHistory);

//<------------ Dashboard & Chart APIs Routes -------------->
router.get("/dashboard-summary", auth, permissions("collection_view"), CollectionController.GetDashboardSummary);
router.get("/chart/loan-amount", auth, permissions("collection_view"), CollectionController.GetYearlyLoanAmountChart);
router.get("/chart/open-close", auth, permissions("collection_view"), CollectionController.GetYearlyOpenCloseChart);


// -------------------- Category Routes --------------------
router.post("/create-category", auth, permissions("category_create"), CategoryController.CreateCategory);
router.get("/get-categories", auth, permissions("category_view"), CategoryController.GetCategoriesList);

// <--------- rooms Routes --------------------->
router.post("/create-room", auth, permissions("rooms_create"), upload.array("images", 5), RoomController.createRoom);
router.get("/get-rooms", auth, permissions("rooms_view"), RoomController.getRooms);
router.get("/get-room/:id", auth, permissions("rooms_view"), RoomController.getRoomById);
router.get("/rooms/:id/related", RoomController.getRelatedRooms);
router.put("/update-room/:id", auth, permissions("rooms_edit"), RoomController.updateRoom);
router.delete("/delete-room/:id", auth, permissions("rooms_delete"), RoomController.deleteRoom);
router.patch("/update-room-status/:id", auth, permissions("room_edit"), RoomController.updateRoomStatus);

// <---------------- users rooms routes ---------------->
router.get("/user-get-rooms", RoomController.getUserRooms);
router.get("/user-get-room/:id", RoomController.getUserRoomById);

// ---------------- User Cart Routes ----------------
router.post("/reserve_room/add", auth, Reserve_Room_Controller.Add_Reserve_Room);
router.get("/reserve_room_list", auth, Reserve_Room_Controller.Get_Reserve_Room);
router.put("/reserve_room/item", auth, Reserve_Room_Controller.Update_Reserve_Room);
router.delete("/reserve_room/item/:itemId", auth, Reserve_Room_Controller.Remove_Reserve_Room);


// <--------- Booking / Reservation Routes --------------------->
router.post("/create-booking", auth, permissions("bookings_create"), BookingController.createBooking);
router.get("/get-bookings", auth, permissions("bookings_view"), BookingController.getBookings);
router.get("/get-booking/:id", auth, permissions("bookings_view"), BookingController.getBookingById);
router.put("/update-booking/:id", auth, permissions("bookings_edit"), BookingController.updateBooking);
router.delete("/delete-booking/:id", auth, permissions("bookings_delete"), BookingController.deleteBooking);

//<--------  Check-in / Check-out Routes  ------------------> 
router.post("/checkin/:id", auth, permissions("booking_checkin"), BookingController.checkIn);
router.post("/checkout/:id", auth, permissions("booking_checkout"), BookingController.checkOut);

// <------Cancel (mark booking cancelled) / Calendar (bookings overlapping the range) routes---------->
router.post("/cancel-booking/:id", auth, permissions("booking_delete"), BookingController.cancelBooking);
router.get("/bookings/calendar", auth, permissions("booking_view"), BookingController.getCalendar);

router.get("/user-get-my-bookings", userAuth, BookingController.UsergetMyBookings);
// <--------- Guest Management Routes --------------------->
router.post("/create-guest", auth, permissions("guests_create"), upload.single("idDocument"), GuestController.createGuest);
router.get("/get-guests", auth, permissions("guests_view"), GuestController.getGuests);
router.get("/get-guest/:id", auth, permissions("guests_view"), GuestController.getGuestById);
router.put("/update-guest/:id", auth, permissions("guests_edit"), upload.single("idDocument"), GuestController.updateGuest);
router.delete("/delete-guest/:id", auth, permissions("guests_delete"), GuestController.deleteGuest);
router.post("/guest/:guestId/add-stay", auth, permissions("guests_edit"), GuestController.addStayHistory);
router.post("/guest/:id/update-loyalty", auth, permissions("guests_edit"), GuestController.updateLoyaltyPoints);
router.get("/get-vip-guest", auth, permissions("guests_view"), GuestController.getVIPGuests);
router.get("/get-repeat-guest", auth, permissions("guests_view"), GuestController.getRepeatGuests);


// <--------- Housekeeping Management Routes --------------------->
router.post("/create-housekeeping", auth, permissions("housekeeping_create"), HousekeepingController.createHousekeepingTask);
router.get("/get-housekeeping", auth, permissions("housekeeping_view"), HousekeepingController.getHousekeepingTasks);
router.put("/update-housekeeping/:id", auth, permissions("housekeeping_edit"), HousekeepingController.updateHousekeepingTask);
router.post("/verify-cleaning/:id", auth, permissions("housekeeping_edit"), HousekeepingController.verifyCleaning);
router.delete("/delete-housekeeping/:id", auth, permissions("housekeeping_delete"), HousekeepingController.deleteHousekeepingTask);


// <--------- Staff Attendance Routes --------------------->
router.post("/create-staff-attendance", auth, permissions("staffattendances_create"), StaffAttendanceController.createStaffAttendance);
router.get("/get-staff-attendance", auth, permissions("staffattendances_view"), StaffAttendanceController.getStaffAttendance);
router.put("/update-staff-attendance/:id", auth, permissions("staffattendances_edit"), StaffAttendanceController.updateStaffAttendance);
router.post("/verify-staff-attendance/:id", auth, permissions("staffattendances_edit"), StaffAttendanceController.verifyStaffAttendance);
router.delete("/delete-staff-attendance/:id", auth, permissions("staffattendances_delete"), StaffAttendanceController.deleteStaffAttendance);
router.get("/staff-attendance-summary", auth, permissions("staffattendances_view"), StaffAttendanceController.getAttendanceSummary);


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
router.post("/create-valet-parking", auth, permissions("valet_create"), ValetParkingController.createParkingSlip)
router.get("/get-valet-parking", auth, permissions("valet_view"), ValetParkingController.getParkingSlips)
router.put("/update-valet-parking/:id", auth, permissions("valet_update"), ValetParkingController.updateParkingStatus)
router.delete("/delete-valet-parking/:id", auth, permissions("valet_delete"), ValetParkingController.deleteParkingSlip)

// <-------- Event Package Routes ------------>
router.post("/create-event-package", auth, permissions("event_create"), EventPackageController.createEventPackage)
router.get("/get-event-package", auth, permissions("event_package_view"), EventPackageController.getPackages)
router.put("/update-event-package/:id", auth, permissions("event_update"), EventPackageController.updatePackage)
router.delete("/delete-event-package/:id", auth, permissions("event_delete"), EventPackageController.deletePackage)

//<-------- Catering Routes ----------->
router.post("/create-catering", auth, permissions("catering_create"), CateringController.createCateringItem)
router.get("/get-catering", auth, permissions("catering_view"), CateringController.getCateringItems)
router.put("/update-catering/:id", auth, permissions("catering_update"), CateringController.updateCateringItem)
router.delete("/delete-catering/:id", auth, permissions("catering_delete"), CateringController.deleteCateringItem)

// <--------- Guest Requests / Service Desk Routes --------------------->
router.post("/create-guest-request", auth, permissions("guest_request_create"), GuestRequestController.createGuestRequest);
router.get("/get-guest-requests", auth, permissions("guest_request_view"), GuestRequestController.getGuestRequests);
router.put("/update-guest-request/:id/status", auth, permissions("guest_request_edit"), GuestRequestController.updateGuestRequestStatus);
router.get("/booking/:bookingId/guest-requests", auth, permissions("guest_request_create_By_id_view"), GuestRequestController.getRequestsByBooking);

// <--------feedback routes -------------> 
router.post("/create-feedback", auth, permissions("feedback_create"), FeedbackController.createFeedback);
router.get("/get-feedbacks", auth, permissions("feedback_view"), FeedbackController.getFeedbacks);
router.get("/get-feedback/:id", auth, permissions("feedback_view"), FeedbackController.getFeedbackById);

//<---------- Maintenance routes --------->
router.post("/create-maintenance", auth, permissions("maintenance_create"), MaintenanceController.createMaintenanceTask);
router.get("/get-maintenance", auth, permissions("maintenance_view"), MaintenanceController.getMaintenanceTasks);
router.put("/update-maintenance/:id", auth, permissions("maintenance_edit"), MaintenanceController.updateMaintenanceStatus);

// Lost & Found
router.post("/create-lostfound", auth, permissions("lostfound_create"), LostFoundController.createLostFound);
router.get("/get-lostfound", auth, permissions("lostfound_view"), LostFoundController.getLostFoundItems);
router.put("/update-lostfound/:id", auth, permissions("lostfound_edit"), LostFoundController.updateLostFoundStatus);

// Assets / Inventory
router.post("/create-asset", auth, permissions("asset_create"), AssetController.createAsset);
router.get("/get-assets", auth, permissions("asset_view"), AssetController.getAssets);
router.put("/update-asset/:id", auth, permissions("asset_edit"), AssetController.updateAssetQuantity);

// -------------------- Users Routes --------------------
router.post("/user-send-otp", UserController.User_sendOtp);
router.post("/user-otp-verify", UserController.User_verifyOtp);
router.get("/user-profile", user_auth, UserController.getUserProfile);
router.put("/update-user-profile", user_auth, upload.single("profileImage"), UserController.updateUserProfile);
router.get("/user-list", auth, UserController.getAllUsers);
router.put("/block-user/:id", auth, UserController.toggleUserBlock);
router.delete("/user-delete/:id", auth, UserController.deleteUser);

// Notifications
router.get("/get-notifications", auth, permissions("notification_view"), NotificationController.getNotifications);
router.post("/notifications/mark-all-read", auth, permissions("notification_create"), NotificationController.markAllRead);

// Create order
router.post("/create-order", userAuth, PaymentController.createPaymentOrder);
router.post("/verify-payment", userAuth, PaymentController.verifyPayment);

// 🔹 New Webhook route
router.post("/razorpay-webhook", PaymentController.razorpayWebhook);

// CREATE (with multiple images)
router.post("/create-banner", upload.array("images", 5), HomeBannerController.createBanner);
router.get("/get-banner", auth, permissions("banner_view"), HomeBannerController.getBanners);
router.put("/update-banner/:id", upload.array("images", 5), HomeBannerController.updateBanner);
router.delete("/delete-banner/:id", HomeBannerController.deleteBanner);

// User side Banner 
router.get("/get-user-banners", HomeBannerController.getUserBanners);

// <-------------- Room Type Controller -------------------------->
router.post("/create-room-type", auth, RoomType_Controller.createRoomType);
router.get("/get-room-type", auth, permissions("typerooms_view"),
  RoomType_Controller.getRoomTypes);
router.put("/update-room-type/:id", RoomType_Controller.updateRoomType);
router.delete("/delete-room-type/:id", RoomType_Controller.deleteRoomType);

// <------------- Report Controller ----------------------->
router.get("/daily-revenue", auth, permissions("daily_report_view"), ReportController.getDailyRevenue);
router.get("/monthly-revenue", auth, permissions("monthly_report_view"), ReportController.getMonthlyRevenue);
router.get("/occupancy", auth, permissions("occupancy_report_view"), ReportController.getOccupancyReport);
router.get("/bookings", auth, permissions("bookings_report_view"), ReportController.getBookingReport);

// <------------- Dashboard Controller ------------------>
router.get("/get-dashboard", auth, permissions("dashboard_view"), DashboardController.getDashboardData)

// -------------------- Staff Routes --------------------

router.post("/staff-create", auth, permissions("staffs_create"), upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "idProofImage", maxCount: 1 },
  { name: "documents", maxCount: 10 },]), staffController.createStaff);
router.get("/staff-list", auth, permissions("staffs_view"), staffController.getAllStaff);
router.get("/staff/:id", auth, permissions("staffs_view"), staffController.getStaffById);
router.put("/staff-update/:id", auth, permissions("staffs_update"), upload.single("profileImage"), staffController.updateStaff);
router.delete("/staff-delete/:id", auth, permissions("staffs_delete"), staffController.deleteStaff);

// <------------------ GET SHIFTS ----------------->
router.get("/shifts", auth, permissions("shifts_view"), Shifts_Controller.getShifts);
router.post("/shifts", auth, permissions("shifts_create"), Shifts_Controller.createShift);
router.put("/update-shift/:id", auth, permissions("shifts_update"), Shifts_Controller.updateShift);
router.delete("/delete-shift/:id", auth, permissions("shifts_delete"), Shifts_Controller.deleteShift);

// <------------- Hotel Policy -------------------->
router.post("/company-policy", auth, permissions("companypolicies_create"), CompanyPolicyController.upsertCompanyPolicy);
router.get("/company-policy", auth, permissions("companypolicies_view"), CompanyPolicyController.getCompanyPolicy);

// <---------------- weekly-off ---------------->
router.post("/weekly-off", auth, permissions("weeklyoffs_create"), WeeklyOffController.createWeeklyOff);
router.get("/weekly-off", auth, permissions("weeklyoffs_view"), WeeklyOffController.getWeeklyOff);
router.put("/weekly-off/:id", auth, permissions("weeklyoffs_update"), WeeklyOffController.updateWeeklyOff);
router.delete("/weekly-off/:id", auth, permissions("weeklyoffs_delete"), WeeklyOffController.deleteWeeklyOff);

// <---------- Holiday -------------->
router.post("/holiday", auth, permissions("holidaies_create"), HolidayController.createHoliday);
router.get("/holiday", auth, permissions("holidaies_view"), HolidayController.getHolidays);
router.get("/holiday/:id", auth, permissions("holidaies_view"), HolidayController.getHolidayById);
router.put("/holiday/:id", auth, permissions("holidaies_update"), HolidayController.updateHoliday);
router.delete("/holiday/:id", auth, permissions("holidaies_delete"), HolidayController.deleteHoliday);

// <---------- Holiday -------------->
router.post("/generate-payroll", auth, permissions("payroll_create"), PayrollController.generatePayroll);
router.get("/get-payrolls", auth, permissions("payroll_view"), PayrollController.getPayrolls);
// router.get("/get-payroll/:id",auth, permissions("payroll_view"), PayrollController.markAsPaid);
router.delete("/delete-payroll/:id", auth, permissions("payroll_delete"), PayrollController.deletePayroll);
router.post("/pay-salary/:id/pay", auth, permissions("payroll_view"), PayrollController.paySalary);
router.get("/get-payment-history/:id/payment", auth, permissions("payroll_view"), PayrollController.getPaymentHistory);

// Compay/Hotel Details -------------->
router.get("/get-hotel-details", auth, permissions("HotelDetails_View"), CompanyController.getCompany);
router.post("/create-hotel-detail", auth, permissions("HotelDetails_Create"), upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "stamp", maxCount: 1 },
  { name: "hrSignature", maxCount: 1 },
]),
  CompanyController.saveCompany
);

module.exports = router;
