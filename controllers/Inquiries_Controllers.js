const StatusModal = require("../models/Status");
const InquiriesModal = require("../models/Inquiries");
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");

// ✅ Email setup (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false, // ignore self-signed certs
  },
});

// ✅ Helper: schedule grouped reminder email
const scheduleReminder = async (inquiry) => {
  if (!inquiry.scheduledAt) return;

  const reminderTime = new Date(inquiry.scheduledAt);
  if (reminderTime <= new Date()) {
    console.log("⚠️ Scheduled time is in the past, skipping reminder.");
    return;
  }

  // Schedule job at the exact scheduledAt time
  schedule.scheduleJob(reminderTime, async () => {
    try {
      // Fetch all inquiries scheduled for this exact time
      const inquiriesAtTime = await InquiriesModal.find({
        scheduledAt: inquiry.scheduledAt,
      });

      if (!inquiriesAtTime.length) return;

      // Build a grouped email message
      let message = `Hi Admin,\n\nYou have scheduled inquiry reminders for the following users:\n\n`;

      inquiriesAtTime.forEach((inq, index) => {
        message += `${index + 1}. 👤 Name: ${inq.name}\n   📧 Email: ${inq.email}\n   📞 Mobile: ${inq.mobile}\n   📍 Location: ${inq.location}\n   🕒 Scheduled For: ${inq.scheduledAt}\n\n`;
      });

      message += `Don't forget to call them!`;

      // Send email to admin
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // admin receives reminder
        subject: `⏰ Reminder: ${inquiriesAtTime.length} Inquiries Scheduled at ${inquiry.scheduledAt}`,
        text: message,
      });

      console.log(`✅ Reminder email sent for ${inquiriesAtTime.length} inquiries at ${inquiry.scheduledAt}`);
    } catch (err) {
      console.error("❌ Email send error:", err);
    }
  });

  console.log("📅 Reminder set for:", inquiry.name, "at", reminderTime);
};


const CreateInquiries = async (req, res) => {
  try {
    const { name, email, mobile, location, status, scheduledDate, scheduledTime } = req.body;

    if (!status)
      return res.status(400).json({ status: 400, message: "Status is required" });

    const statusExists = await StatusModal.findOne({ name: status }).maxTimeMS(5000);
    if (!statusExists)
      return res.status(400).json({ status: 400, message: "Invalid status" });

    // ✅ Parse date and time safely
    let parsedDate = scheduledDate ? new Date(scheduledDate) : null;
    let parsedTime = null;

    if (scheduledDate && scheduledTime) {
      // Ensure time includes seconds
      const timeWithSeconds = scheduledTime.length === 5 ? scheduledTime + ":00" : scheduledTime;
      parsedTime = new Date(`${scheduledDate}T${timeWithSeconds}`);
    }

    const newInquiries = new InquiriesModal({
      name,
      email,
      mobile,
      location,
      status,
      scheduledDate: parsedDate,
      scheduledTime: parsedTime,
      scheduledAt: parsedTime || parsedDate || null,
    });

    await newInquiries.save();

    // ✅ Schedule the reminder email if date/time exists
    scheduleReminder(newInquiries);

    return res.status(201).json({
      status: 201,
      message: "Inquiry added successfully",
      data: newInquiries,
    });
  } catch (error) {
    console.error("Create Inquiries Error:", error);
    return res.status(500).json({ status: 500, message: "Server error" });
  }
};


// Get all inquiries
const GetInquiriesList = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const total = await InquiriesModal.countDocuments().maxTimeMS(5000);
    const inquiries = await InquiriesModal.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .maxTimeMS(5000);

    return res.status(200).json({
      status: 200,
      message: "Inquiries fetched successfully",
      data: inquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Inquiries Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server side error fetching inquiries",
      error: error.message,
    });
  }
};

// Get inquiries by status
const GetInquiriesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    if (!status) {
      return res.status(400).json({ status: 400, message: "Status is required" });
    }

    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const total = await InquiriesModal.countDocuments({ status });
    const inquiries = await InquiriesModal.find({ status })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: 200,
      message: `Inquiries with status "${status}" fetched successfully`,
      data: inquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Inquiries by Status Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server side error fetching inquiries by status",
    });
  }
};

module.exports = { CreateInquiries, GetInquiriesList, GetInquiriesByStatus };


// const StatusModal = require("../models/Status");
// const InquiriesModal = require("../models/Inquiries");

// // ---------------- Create Inquiry ----------------
// const CreateInquiries = async (req, res) => {
//   try {
//     const { name, email, mobile, location, status } = req.body;

//     if (!status) return res.status(400).json({ status: 400, message: "Status is required" });

//     const statusExists = await StatusModal.findOne({ name: status }).maxTimeMS(5000);
//     if (!statusExists) return res.status(400).json({ status: 400, message: "Invalid status" });

//     const newInquiries = new InquiriesModal({ name, email, mobile, location, status });
//     await newInquiries.save();

//     return res.status(201).json({
//       status: 201,
//       message: "Inquiry added successfully",
//       data: newInquiries,
//     });
//   } catch (error) {
//     console.error("Create Inquiries Error:", error);
//     return res.status(500).json({ status: 500, message: "Server error" });
//   }
// };

// // ---------------- Get All Inquiries with Pagination ----------------
// const GetInquiriesList = async (req, res) => {
//   try {
//     let { page, limit } = req.query;
//     page = parseInt(page) || 1;
//     limit = parseInt(limit) || 10;
//     const skip = (page - 1) * limit;

//     const total = await InquiriesModal.countDocuments().maxTimeMS(5000);
//     const inquiries = await InquiriesModal.find()
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .maxTimeMS(5000);

//     return res.status(200).json({
//       status: 200,
//       message: "Inquiries fetched successfully",
//       data: inquiries,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Get Inquiries Error:", error);
//     return res.status(500).json({ status: 500, message: "Server error" });
//   }
// };

// // ---------------- Get Inquiries By Status ----------------
// const GetInquiriesByStatus = async (req, res) => {
//   try {
//     const { status } = req.params;
//     if (!status) return res.status(400).json({ status: 400, message: "Status is required" });

//     let { page, limit } = req.query;
//     page = parseInt(page) || 1;
//     limit = parseInt(limit) || 10;
//     const skip = (page - 1) * limit;

//     const total = await InquiriesModal.countDocuments({ status }).maxTimeMS(5000);
//     const inquiries = await InquiriesModal.find({ status })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .maxTimeMS(5000);

//     return res.status(200).json({
//       status: 200,
//       message: `Inquiries with status "${status}" fetched successfully`,
//       data: inquiries,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Get Inquiries by Status Error:", error);
//     return res.status(500).json({ status: 500, message: "Server error" });
//   }
// };

// module.exports = { CreateInquiries, GetInquiriesList, GetInquiriesByStatus };
