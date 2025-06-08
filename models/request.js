const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestType: {
      type: String,
      enum: ["leave", "overtime"],
      required: true,
    },
    status: {
      type: String,
      enum: ["accepted", "pending", "rejected"],
      default: "pending",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", // مدیر بررسی‌کننده
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
const Request = mongoose.model("Request", RequestSchema);

module.exports = Request;
