const StaffCertificate = require("../models/StaffCertificate");
const Staff = require("../models/Staff");

const generateCertificate = async (req, res) => {
  try {
    const { staffId, certificateType, remarks, certificateData } = req.body;

    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    const count = await StaffCertificate.countDocuments();

    const certificateNo = `CERT-${Date.now()}-${count + 1}`;

    const certificate = await StaffCertificate.create({
      staff: staffId,
      certificateType,
      remarks,
      certificateNo,

      certificateData: {
        salary: certificateData?.salary || staff.salary,

        joiningDate: certificateData?.joiningDate || staff.joiningDate,

        relievingDate: certificateData?.relievingDate,

        promotedTo: certificateData?.promotedTo,

        promotionDate: certificateData?.promotionDate,

        internshipStartDate: certificateData?.internshipStartDate,

        internshipEndDate: certificateData?.internshipEndDate,

        internshipDepartment: certificateData?.internshipDepartment,

        experienceYears:
          certificateData?.experienceYears || staff.experienceYears,

        reason: certificateData?.reason,

        customMessage: certificateData?.customMessage,
      },

      generatedBy: req.adminId,
    });

    res.status(201).json({
      success: true,
      message: "Certificate generated successfully",
      data: certificate,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Error generating certificate",
    });
  }
};

const getCertificates = async (req, res) => {
  try {
    const certificates = await StaffCertificate.find()
      .populate("staff", "name employeeCode role salary")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: certificates,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching certificates",
    });
  }
};

const getCertificateDetails = async (req, res) => {
  try {
    const certificate = await StaffCertificate.findById(req.params.id)
      .populate("staff")
      .populate("generatedBy", "name");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.json({
      success: true,
      data: certificate,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching certificate",
    });
  }
};

const updateCertificate = async (req, res) => {
  try {
    const certificate = await StaffCertificate.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );

    res.json({
      success: true,
      message: "Certificate updated successfully",
      data: certificate,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};

const deleteCertificate = async (
  req,
  res
) => {
  try {
    await StaffCertificate.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message:
        "Certificate deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message:
        "Delete failed",
    });
  }
};

module.exports = {
  generateCertificate,
  getCertificates,
  getCertificateDetails,
  deleteCertificate,
};
