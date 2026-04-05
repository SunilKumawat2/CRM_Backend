// controllers/homeBannerController.js
const HomeBanner = require("../models/HomeBanner");


// <------------- Create Banner --------------->
const createBanner = async (req, res) => {
  try {
    const { title, subtitle } = req.body;

    if (!title) {
      return res.status(400).json({
        status: 400,
        message: "Title is required",
      });
    }

    // get uploaded images
    const images = req.files ? req.files.map((file) => file.filename) : [];

    const banner = await HomeBanner.create({
      title,
      subtitle,
      images,
      createdBy: req.adminId,
    });

    res.status(201).json({
      status: 201,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (err) {
    console.error("Create Banner Error:", err);
    res.status(500).json({
      status: 500,
      message: "Server error creating banner",
    });
  }
};



// <----------- Get Banners (Paginated) -------------------->
const getBanners = async (req, res) => {
  try {
    let { page = 1, limit = 10, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // optional search on title
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [total, banners] = await Promise.all([
      HomeBanner.countDocuments(query),
      HomeBanner.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.status(200).json({
      status: 200,
      message: "Banners fetched successfully",
      data: banners,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get Banners Error:", err);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching banners",
    });
  }
};



// <--------- Delete Banner --------------------->
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await HomeBanner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({
        status: 404,
        message: "Banner not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Banner deleted successfully",
    });
  } catch (err) {
    console.error("Delete Banner Error:", err);
    res.status(500).json({
      status: 500,
      message: "Server error deleting banner",
    });
  }
};



// <------- Update Banner Controller -------------->
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle } = req.body;

    const banner = await HomeBanner.findById(id);

    if (!banner) {
      return res.status(404).json({
        status: 404,
        message: "Banner not found",
      });
    }

    // update fields
    if (title) banner.title = title;
    if (subtitle) banner.subtitle = subtitle;

    // update images if new uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.filename);
      banner.images = newImages; // replace old images
    }

    await banner.save();

    return res.status(200).json({
      status: 200,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (err) {
    console.error("Update Banner Error:", err);
    return res.status(500).json({
      status: 500,
      message: "Something went wrong",
    });
  }
};

// <----------- Get Banners for User (Frontend) ------------>
const getUserBanners = async (req, res) => {
  try {
    const banners = await HomeBanner.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 200,
      message: "Banners fetched successfully",
      data: banners,
    });
  } catch (err) {
    console.error("User Get Banner Error:", err);
    return res.status(500).json({
      status: 500,
      message: "Server error fetching banners",
    });
  }
};


module.exports = {
  createBanner,
  getBanners,
  deleteBanner,
  updateBanner,
  getUserBanners
};