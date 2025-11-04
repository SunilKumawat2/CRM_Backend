const CategoryModel = require("../models/Category");

// ---------------------- Create Category ----------------------
const CreateCategory = async (req, res) => {
  try {
    const { category_name } = req.body;

    if (!category_name) {
      return res.status(400).json({
        status: 400,
        message: "category_name is required",
      });
    }

    const existingCategory = await CategoryModel.findOne({ category_name });
    if (existingCategory) {
      return res.status(400).json({
        status: 400,
        message: "Category already exists",
      });
    }

    const newCategory = new CategoryModel({ category_name });
    await newCategory.save();

    return res.status(201).json({
      status: 201,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error("❌ CreateCategory Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error while creating category",
    });
  }
};

// ---------------------- Get All Categories ----------------------
const GetCategoriesList = async (req, res) => {
  try {
    const categories = await CategoryModel.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: 200,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.error("❌ GetCategoriesList Error:", error);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching categories",
    });
  }
};

module.exports = {
  CreateCategory,
  GetCategoriesList,
};
