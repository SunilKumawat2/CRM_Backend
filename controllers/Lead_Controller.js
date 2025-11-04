const LeadModel = require("../models/Lead");
const CategoryModel = require("../models/Category");

// ---------------------- Create Lead ----------------------
const createLead = async (req, res) => {
  try {
    const {
      lead_name,
      first_name,
      last_name,
      telephone,
      email,
      lead_value,
      assigned,
      notes,
      source,
      category,
      tags,
      last_contacted_date,
      total_budget,
      target_date,
      content_type,
      brand_name,
      company_name,
      street,
      city,
      state,
      zip_code,
      country,
      website,
    } = req.body;

    if (!lead_name || !first_name || !last_name || !telephone || !email || !assigned) {
      return res.status(400).json({
        status: 400,
        message: "Required fields missing: lead_name, first_name, last_name, telephone, email, assigned",
      });
    }

    // Validate category if provided
    if (category) {
      const categoryExists = await CategoryModel.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          status: 400,
          message: "Category not found",
        });
      }
    }

    const newLead = new LeadModel({
      lead_name,
      first_name,
      last_name,
      telephone,
      email,
      lead_value: lead_value || 0,
      assigned,
      notes: notes || "",
      source,
      category: category || null,
      tags: tags || [],
      last_contacted_date,
      total_budget: total_budget || 0,
      target_date,
      content_type,
      brand_name,
      company_name,
      street,
      city,
      state,
      zip_code,
      country,
      website,
    });

    await newLead.save();

    return res.status(201).json({
      status: 201,
      message: "Lead created successfully",
      data: newLead,
    });
  } catch (error) {
    console.error("❌ CreateLead Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error while creating lead",
    });
  }
};

// ---------------------- Get Leads ----------------------
const getLeads = async (req, res) => {
  try {
    const { assigned, source, category, startDate, endDate } = req.query;

    let filter = {};
    if (assigned) filter.assigned = assigned;
    if (source) filter.source = source;
    if (category) filter.category = category;

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const leads = await LeadModel.find(filter)
      .populate("category", "category_name") // populate category name
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 200,
      message: "Leads fetched successfully",
      data: leads,
    });
  } catch (error) {
    console.error("❌ GetLeads Error:", error);
    res.status(500).json({
      status: 500,
      message: "Server error fetching leads",
    });
  }
};

module.exports = {
  createLead,
  getLeads,
};
