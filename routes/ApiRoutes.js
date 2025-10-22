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
router.post(
  "/create-role",
  auth,
  permissions("role_create"),
  roleController.createRole
);

// Get Roles (requires "role_view" permission)
router.get(
  "/get-roles",
  auth,
  permissions("role_view"),
  roleController.getRoles
);

// Delete Role (requires "role_delete" permission)
router.delete(
  "/delete-role/:id",
  auth,
  permissions("role_delete"),
  roleController.deleteRole
);

router.put(
  "/update-role/:id",
  auth,
  permissions("role_edit"),
  roleController.updateRole
);

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




// router.get(
//   "/get-collections-by-status/:status",
//   auth,
//   permissions("collection_view"),
//   CollectionController.GetCollectionsByStatus
// );

module.exports = router;
