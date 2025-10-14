// const StatusModal = require("../models/Status");
// const InquiriesModal = require("../models/Inquiries");

// // Create a new inquiry
// const CreateInquiries = async (req, res) => {
//   try {
//     const { name, email, mobile, location, status } = req.body;

//     if (!status) {
//       return res.status(400).json({ status: 400, message: "Status is required" });
//     }

//     const statusExists = await StatusModal.findOne({ name: status });
//     if (!statusExists) {
//       return res.status(400).json({
//         status: 400,
//         message: "Invalid status. Please create it first.",
//       });
//     }

//     const newInquiries = new InquiriesModal({
//       name,
//       email,
//       mobile,
//       location,
//       status,
//     });

//     await newInquiries.save();
//     return res.status(201).json({
//       status: 201,
//       message: "Successfully added the inquiry",
//       data: newInquiries,
//     });
//   } catch (error) {
//     console.log("Add Inquiries Error:", error);
//     return res.status(500).json({
//       status: 500,
//       message: "Server side error adding the inquiry",
//     });
//   }
// };

// // Get all inquiries with pagination
// // const GetInquiriesList = async (req, res) => {
// //   try {
// //     let { page, limit } = req.query;

// //     page = parseInt(page) || 1;   // default page = 1
// //     limit = parseInt(limit) || 10; // default limit = 10
// //     const skip = (page - 1) * limit;

// //     const total = await InquiriesModal.countDocuments();
// //     const inquiries = await InquiriesModal.find()
// //       .sort({ createdAt: -1 })
// //       .skip(skip)
// //       .limit(limit);

// //     return res.status(200).json({
// //       status: 200,
// //       message: "Inquiries fetched successfully",
// //       data: inquiries,
// //       pagination: {
// //         total,
// //         page,
// //         limit,
// //         totalPages: Math.ceil(total / limit),
// //       },
// //     });
// //   } catch (error) {
// //     console.log("Get Inquiries Error:", error);
// //     return res.status(500).json({
// //       status: 500,
// //       message: "Server side error fetching inquiries",
// //     });
// //   }
// // };


// // Example: Add a maxTimeMS to prevent hanging
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
//       .maxTimeMS(5000); // 5 seconds timeout

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
//     return res.status(500).json({
//       status: 500,
//       message: "Server side error fetching inquiries",
//       error: error.message,
//     });
//   }
// };

// // Get inquiries by status
// // Get inquiries by status with pagination
// const GetInquiriesByStatus = async (req, res) => {
//   try {
//     const { status } = req.params;
//     if (!status) {
//       return res.status(400).json({ status: 400, message: "Status is required" });
//     }

//     let { page, limit } = req.query;
//     page = parseInt(page) || 1;
//     limit = parseInt(limit) || 10;
//     const skip = (page - 1) * limit;

//     const total = await InquiriesModal.countDocuments({ status });
//     const inquiries = await InquiriesModal.find({ status })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

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
//     console.log("Get Inquiries by Status Error:", error);
//     return res.status(500).json({
//       status: 500,
//       message: "Server side error fetching inquiries by status",
//     });
//   }
// };

// module.exports = { CreateInquiries, GetInquiriesList, GetInquiriesByStatus };


const StatusModal = require("../models/Status");
const InquiriesModal = require("../models/Inquiries");

// ---------------- Create Inquiry ----------------
const CreateInquiries = async (req, res) => {
  try {
    const { name, email, mobile, location, status } = req.body;

    if (!status) return res.status(400).json({ status: 400, message: "Status is required" });

    const statusExists = await StatusModal.findOne({ name: status }).maxTimeMS(5000);
    if (!statusExists) return res.status(400).json({ status: 400, message: "Invalid status" });

    const newInquiries = new InquiriesModal({ name, email, mobile, location, status });
    await newInquiries.save();

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

// ---------------- Get All Inquiries with Pagination ----------------
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
    return res.status(500).json({ status: 500, message: "Server error" });
  }
};

// ---------------- Get Inquiries By Status ----------------
const GetInquiriesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    if (!status) return res.status(400).json({ status: 400, message: "Status is required" });

    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const total = await InquiriesModal.countDocuments({ status }).maxTimeMS(5000);
    const inquiries = await InquiriesModal.find({ status })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .maxTimeMS(5000);

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
    return res.status(500).json({ status: 500, message: "Server error" });
  }
};

module.exports = { CreateInquiries, GetInquiriesList, GetInquiriesByStatus };
