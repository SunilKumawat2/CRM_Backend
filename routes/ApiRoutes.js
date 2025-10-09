const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");
const Inquiries_Controller = require("../controllers/Inquiries_Controllers");
const statusController = require("../controllers/statusController");
const adminLoginController = require("../controllers/Admin_Login_Controller");

// ------------------- Multer setup for profile image -------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/photos"); // store admin images here
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// <----------- Routes for Inquiries ---------------->
router.post("/create-inquiries", Inquiries_Controller.CreateInquiries);
router.get("/get-inquiries", Inquiries_Controller.GetInquiriesList);
router.get(
  "/get-inquiries-by-status/:status",
  Inquiries_Controller.GetInquiriesByStatus
);

// <----------------- Routes for the status -------------> 
router.post("/create-status", statusController.createStatus);
router.get("/get-status", statusController.getStatuses);

// <----------------- Routes for Admin Login/Register -------------> 
router.post("/admin-register", adminLoginController.registerAdmin);
router.post("/admin-login", adminLoginController.loginAdmin);

// <----------------- Route for Admin Profile Update -------------> 
router.get("/admin-profile", auth, adminLoginController.getAdminProfile);
router.put("/admin-profile", auth, upload.single("profileImage"), adminLoginController.updateAdminProfile);
module.exports = router;
