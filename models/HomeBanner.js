// models/HomeBanner.js
const mongoose = require("mongoose");

const homeBannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    images: [
      {
        type: String, // store image filename or URL
        required: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLogin",
    //   required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeBanner", homeBannerSchema);