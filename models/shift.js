const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: String, // e.g., "08:00"
  endTime: String    // e.g., "16:00"
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: Number, // 1 = Saturday, ..., 7 = Friday
  time: [timeSlotSchema]
}, { _id: false });

const exceptionDaySchema = new mongoose.Schema({
  day: Number,
  date: Date,
  time: [timeSlotSchema]
}, { _id: false });

const shiftSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  }, 
   shiftDays: [daySchema],
  exceptionDays: [exceptionDaySchema]
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
