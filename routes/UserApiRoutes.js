const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Middlewares
const user_auth = require("../middleware/userAuth");

// Controllers
const RoomController = require("../controllers/RoomController");
const UserController = require("../controllers/UserController");
const PaymentController = require("../controllers/PaymentController");

// -------------------- Multer setup --------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/photos"),
    filename: (req, file, cb) =>
      cb(null, Date.now() + path.extname(file.originalname)),
  });
  const upload = multer({ storage });


  // <---------------- users rooms routes ---------------->
router.get("/user-get-rooms", RoomController.getUserRooms);
router.get("/user-get-room/:id", RoomController.getUserRoomById);


// -------------------- Users Routes --------------------
router.post("/user-send-otp", UserController.User_sendOtp);
router.post("/user-otp-verify", UserController.User_verifyOtp);
router.get("/user-profile", user_auth, UserController.getUserProfile);
router.put("/update-user-profile", user_auth, upload.single("profileImage"), UserController.updateUserProfile);


// Create order
router.post("/create-order", PaymentController.createPaymentOrder);
router.post("/verify-payment", PaymentController.verifyPayment);

module.exports = router;