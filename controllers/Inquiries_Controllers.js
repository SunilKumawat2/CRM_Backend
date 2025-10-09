const StatusModal = require("../models/Status");
const InquiriesModal = require("../models/Inquiries");

// Create a new inquiry
const CreateInquiries = async (req, res) => {
  try {
    const { name, email, mobile, location, status } = req.body;

    if (!status) {
      return res.status(400).json({ status: 400, message: "Status is required" });
    }

    const statusExists = await StatusModal.findOne({ name: status });
    if (!statusExists) {
      return res.status(400).json({
        status: 400,
        message: "Invalid status. Please create it first.",
      });
    }

    const newInquiries = new InquiriesModal({
      name,
      email,
      mobile,
      location,
      status,
    });

    await newInquiries.save();
    return res.status(201).json({
      status: 201,
      message: "Successfully added the inquiry",
      data: newInquiries,
    });
  } catch (error) {
    console.log("Add Inquiries Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server side error adding the inquiry",
    });
  }
};

// Get all inquiries
const GetInquiriesList = async (req, res) => {
  try {
    const inquiries = await InquiriesModal.find().sort({ createdAt: -1 }); // latest first

    return res.status(200).json({
      status: 200,
      message: "Inquiries fetched successfully",
      data: inquiries,
    });
  } catch (error) {
    console.log("Get Inquiries Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server side error fetching inquiries",
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

    const inquiries = await InquiriesModal.find({ status }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: 200,
      message: `Inquiries with status "${status}" fetched successfully`,
      data: inquiries,
    });
  } catch (error) {
    console.log("Get Inquiries by Status Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server side error fetching inquiries by status",
    });
  }
};

module.exports = { CreateInquiries, GetInquiriesList, GetInquiriesByStatus };
