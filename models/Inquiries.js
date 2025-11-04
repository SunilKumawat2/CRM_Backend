const mongoose = require("mongoose");

const inquiriesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: false,
    },
    scheduledTime: {
      type: Date,
      required: false,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const InquiriesModal = mongoose.model("Inquiries", inquiriesSchema);
module.exports = InquiriesModal;
