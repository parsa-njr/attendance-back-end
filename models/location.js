const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    range: {
      type: Number, 
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Location", LocationSchema);
