const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");

const Inquiries_Controller = require("../controllers/Inquiries_Controllers");
const statusController = require("../controllers/statusController");
const adminLoginController = require("../controllers/Admin_Login_Controller");
const roleController = require("../controllers/RoleController");

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/photos"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ----- Existing Routes -----
router.post("/create-inquiries", Inquiries_Controller.CreateInquiries);
router.get("/get-inquiries", Inquiries_Controller.GetInquiriesList);
router.get("/get-inquiries-by-status/:status", Inquiries_Controller.GetInquiriesByStatus);

router.post("/create-status", statusController.createStatus);
router.get("/get-status", statusController.getStatuses);

router.post("/admin-register", auth, adminLoginController.registerAdmin);
router.post("/admin-login", adminLoginController.loginAdmin);
router.get("/admin-list", auth, adminLoginController.getAllAdmins);
router.delete("/admin-delete/:id", auth, adminLoginController.deleteAdmin);
router.get("/admin-profile", auth, adminLoginController.getAdminProfile);
router.put("/admin-profile", auth, upload.single("profileImage"), adminLoginController.updateAdminProfile);

// ----- ✅ Role Routes -----
router.post("/create-role", auth, roleController.createRole);
router.get("/get-roles", auth, roleController.getRoles);
router.delete("/delete-role/:id", auth, roleController.deleteRole);

module.exports = router;
