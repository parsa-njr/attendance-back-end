const mongoose = require("mongoose");

const timeSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const shiftDaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  isOffDay: { type: Boolean, default: false },
  time: { type: [timeSchema], required: true },
});

const exceptionDaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  date: { type: Date, required: true },
  time: { type: [timeSchema], required: true },
});



const shiftSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    shiftName: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    formalHolidays: { type: Boolean, default: false },
    shiftDays: { type: [shiftDaySchema], default: [] },
    exceptionDays: { type: [exceptionDaySchema], default: [] },
  },
  { timestamps: true }
);

const Shift = mongoose.model("Shift", shiftSchema);

module.exports = Shift;
