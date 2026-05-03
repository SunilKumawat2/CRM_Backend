const Company = require("../models/Company");

// ✅ GET COMPANY DETAILS
const getCompany = async (req, res) => {
  try {
    const company = await Company.findOne(); // single record

    res.json({
      success: true,
      data: company,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching company" });
  }
};

// ✅ CREATE / UPDATE (UPSERT)
const saveCompany = async (req, res) => {
  try {
    const { name, logo, phone, address, email } = req.body;

    let company = await Company.findOne();

    if (company) {
      company.name = name;
      company.logo = logo;
      company.phone = phone;
      company.address = address;
      company.email = email;
      await company.save();
    } else {
      company = await Company.create({
        name,
        logo,
        phone,
        address,
        email,
      });
    }

    res.json({
      success: true,
      message: "Company saved",
      data: company,
    });
  } catch (err) {
    res.status(500).json({ message: "Error saving company" });
  }
};

module.exports = {
  getCompany,
  saveCompany,
};