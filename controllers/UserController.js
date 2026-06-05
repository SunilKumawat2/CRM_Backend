const User = require("../models/Users");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const SendOTP = require("../utils/Send_otp");
const VerifyOTP = require("../utils/Otp_Verify");
const firebase_token = require("../config/firebaseAdmin");
const { getIo } = require("../middleware/socket");
const Notification = require("../models/Notification");

// ------------------- Send OTP (Register / Login) -------------------
const User_sendOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        status: 400,
        message: "Email or phone required",
      });
    }

    let user;

    // ---------------- EMAIL FLOW ----------------
    if (email) {
      const normalizedEmail = email.toLowerCase();

      user = await User.findOne({ email: normalizedEmail });

      // Auto-register if not exists
      if (!user) {
        user = await User.create({
          email: normalizedEmail,
          isVerified: false,
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000);

      user.otp = otp;
      user.otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min
      await user.save();

      console.log("SEND EMAIL OTP:", {
        email: user.email,
        otp,
        expiry: user.otpExpiry,
      });

      // 🔴 ACTUAL EMAIL SEND HERE (nodemailer)

      return res.status(200).json({
        status: 200,
        message: "OTP sent to email",
        otp, // dev only
      });
    }

    // ---------------- PHONE FLOW (FIREBASE HANDLES OTP) ----------------
    if (phone) {
      user = await User.findOne({ phone });

      if (!user) {
        user = await User.create({
          phone,
          isVerified: false,
        });
      }

      // ❌ NO OTP GENERATION HERE
      return res.status(200).json({
        status: 200,
        message: "OTP sent to phone (via Firebase)",
      });
    }
  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
};

// ------------------- Verify OTP & Login -------------------
const User_verifyOtp = async (req, res) => {
  try {
    const { email, phone, otp, firebaseToken } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        status: 400,
        message: "Email or phone required",
      });
    }

    let user;

    // ================= EMAIL FLOW =================
    if (email) {
      if (!otp) {
        return res.status(400).json({
          status: 400,
          message: "OTP required",
        });
      }

      const normalizedEmail = email.toLowerCase();

      user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "User not found",
        });
      }

      // 🚨 BLOCK CHECK (IMPORTANT)
      if (user.isBlocked) {
        return res.status(403).json({
          status: 403,
          message:
            user.blockedReason ||
            "Your account has been blocked. Contact support.",
        });
      }

      if (!user.otp || !user.otpExpiry) {
        return res.status(400).json({
          status: 400,
          message: "OTP expired or invalid. Please request a new OTP.",
        });
      }

      // Expiry check
      if (Date.now() > user.otpExpiry) {
        return res.status(400).json({
          status: 400,
          message: "OTP expired",
        });
      }

      // Match OTP
      if (String(user.otp) !== String(otp)) {
        return res.status(400).json({
          status: 400,
          message: "Invalid OTP",
        });
      }

      // Success
      user.isVerified = true;
      user.otp = null;
      user.otpExpiry = null;

      await user.save();
    }

    // ================= PHONE FLOW =================
    if (phone) {
      if (!firebaseToken) {
        return res.status(400).json({
          status: 400,
          message: "Firebase token required",
        });
      }

      const decoded = await firebase_token
        .auth()
        .verifyIdToken(firebaseToken);

      if (decoded.phone_number !== phone) {
        return res.status(401).json({
          status: 401,
          message: "Phone verification failed",
        });
      }

      user = await User.findOne({ phone });

      if (!user) {
        user = await User.create({
          phone,
          isVerified: true,
        });
      } else {
        // 🚨 BLOCK CHECK (IMPORTANT)
        if (user.isBlocked) {
          return res.status(403).json({
            status: 403,
            message:
              user.blockedReason ||
              "Your account has been blocked. Contact support.",
          });
        }

        user.isVerified = true;
        await user.save();
      }
    }

    // ================= FINAL SAFETY CHECK =================
    if (!user) {
      return res.status(400).json({
        status: 400,
        message: "User authentication failed",
      });
    }

    // ================= JWT =================
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
          isVerified: user.isVerified,
          isBlocked: user.isBlocked, // optional but useful
        },
        token,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error during OTP verification",
    });
  }
};

// ------------------- Get User Profile -------------------
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-otp -otpExpiry");

        if (!user)
            return res.status(404).json({
                status: 404,
                message: "User not found",
            });

        return res.status(200).json({
            status: 200,
            message: "User profile fetched successfully",
            data: user,
        });
    } catch (error) {
        console.error("Get User Profile Error:", error);
        return res.status(500).json({
            status: 500,
            message: "Server error fetching profile",
        });
    }
};

// ------------------- Update User Profile -------------------
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    // Only allow updating specific fields
    const allowedFields = ["phone", "alternative_number", "address", "pin_code", "bio"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Update profile image if provided
    if (req.file) {
      const imagePath = `/uploads/photos/${req.file.filename}`;
      if (user.profileImage && fs.existsSync(path.join(__dirname, "..", user.profileImage))) {
        fs.unlinkSync(path.join(__dirname, "..", user.profileImage));
      }
      user.profileImage = imagePath;
    }

    await user.save();

    return res.status(200).json({
      status: 200,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update User Profile Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error updating profile",
    });
  }
};

// ------------------- Get All Users (Admin only) -------------------
const getAllUsers = async (req, res) => {
    try {
        let { page = 1, limit = 20 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();

        const users = await User.find()
            .select("-otp -otpExpiry")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            status: 200,
            message: "User list fetched successfully",
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            data: users,
        });
    } catch (error) {
        console.error("Get All Users Error:", error);
        return res.status(500).json({
            status: 500,
            message: "Server error fetching user list",
        });
    }
};

// ------------------- Delete User -------------------
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user)
            return res.status(404).json({
                status: 404,
                message: "User not found",
            });

        await User.findByIdAndDelete(id);

        return res.status(200).json({
            status: 200,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Delete User Error:", error);
        return res.status(500).json({
            status: 500,
            message: "Server error deleting user",
        });
    }
};

// <--------------- user Block ---------------->
const toggleUserBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // optional

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      // 🔓 UNBLOCK
      user.isBlocked = false;
      user.blockedAt = null;
      user.blockedReason = "";
    } else {
      // 🔒 BLOCK
      user.isBlocked = true;
      user.blockedAt = new Date();
      user.blockedReason = reason || "Violation of policies";
    }

    await user.save();

    return res.status(200).json({
      status: 200,
      message: user.isBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",
      data: user,
    });
  } catch (error) {
    console.error("Block User Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
};

module.exports = {
    User_sendOtp,
    User_verifyOtp,
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    deleteUser,
    toggleUserBlock
};
