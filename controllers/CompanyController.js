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

    console.log("BODY =>", req.body);
    console.log("FILE =>", req.file);

    const {
      name,
      phone,
      address,
      email,
      hrName,
      hrDesignation,
    } = req.body;

    let logo = "";
    let stamp = "";
    let hrSignature = "";

    if (req.files?.logo?.[0]) {
      logo = req.files.logo[0].filename;
    }

    if (req.files?.stamp?.[0]) {
      stamp = req.files.stamp[0].filename;
    }

    if (req.files?.hrSignature?.[0]) {
      hrSignature = req.files.hrSignature[0].filename;
    }

    let company = await Company.findOne();

    if (company) {

      company.name = name;
      company.phone = phone;
      company.address = address;
      company.email = email;
      company.hrName = hrName;
      company.hrDesignation = hrDesignation;

      if (logo) {
        company.logo = logo;
      }
      
      if (stamp) {
        company.stamp = stamp;
      }
      
      if (hrSignature) {
        company.hrSignature = hrSignature;
      }

      await company.save();

    } else {

      company = await Company.create({
        name,
        logo,
        phone,
        address,
        email,
        hrName,
        hrDesignation,
      });

    }

    return res.status(200).json({
      success: true,
      message: "Company saved successfully",
      data: company,
    });

  } catch (err) {

    console.log("SAVE COMPANY ERROR =>", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};
module.exports = {
  getCompany,
  saveCompany,
};