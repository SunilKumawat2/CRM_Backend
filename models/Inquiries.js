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
    //   match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      required: true, // now must be provided dynamically
      trim: true,
    },
  },
  { timestamps: true }
);

const InquiriesModal = mongoose.model("Inquiries", inquiriesSchema);

module.exports = InquiriesModal;
