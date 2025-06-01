const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  checkIn: Date,
  checkOut: Date,
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, required: true },
  sessions: [sessionSchema],
}, { timestamps: true });

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
