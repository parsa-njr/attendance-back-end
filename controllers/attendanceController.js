const Attendance = require("../models/attendance");
const Shift = require("../models/Shift");
const LocationRange = require("../models/LocationRange");
const getDistanceMeters = require("../utils/getDistanceMeters");
const { tryCatch } = require("../utils/tryCatch");

function getShiftTimeForDate(shift, date) {
  const dayOfWeek = date.getDay();
  const targetDate = date.toISOString().slice(0, 10);

  const exception = shift.exceptionDays.find(
    (e) => e.date.toISOString().slice(0, 10) === targetDate
  );

  if (exception) return exception.time;

  const convertedDay = ((dayOfWeek + 1) % 7) + 1;
  const normalDay = shift.shiftDays.find((d) => d.day === convertedDay);
  return normalDay ? normalDay.time : [];
}

const checkIn = tryCatch(async (req, res) => {
  const userId = req.user.id;
  const { lat, lng } = req.body;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  try {
    const locationRange = await LocationRange.findOne();
    const distance = getDistanceMeters(
      lat,
      lng,
      locationRange.center.lat,
      locationRange.center.lng
    );

    if (distance > locationRange.radius) {
      return res.status(400).json({ message: "Outside check-in area" });
    }

    const shift = await Shift.findOne(); // TODO: use user-based shifts
    const shiftTime = getShiftTimeForDate(shift, today);

    let attendance = await Attendance.findOne({ user: userId, date: todayStr });
    if (!attendance) {
      attendance = new Attendance({
        user: userId,
        date: todayStr,
        sessions: [],
      });
    }

    attendance.sessions.push({
      checkIn: today,
    });

    await attendance.save();
    res
      .status(200)
      .json({ message: "Check-in successful", attendance, shiftTime });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const checkOut = tryCatch(async (req, res) => {
  const userId = req.user.id;
  const { lat, lng } = req.body;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  try {
    const locationRange = await LocationRange.findOne();
    const distance = getDistanceMeters(
      lat,
      lng,
      locationRange.center.lat,
      locationRange.center.lng
    );

    if (distance > locationRange.radius) {
      return res.status(400).json({ message: "Outside check-out area" });
    }

    const attendance = await Attendance.findOne({
      user: userId,
      date: todayStr,
    });
    if (!attendance || attendance.sessions.length === 0) {
      return res.status(400).json({ message: "No check-in found" });
    }

    const lastSession = attendance.sessions[attendance.sessions.length - 1];
    if (lastSession.checkOut) {
      return res.status(400).json({ message: "Already checked out" });
    }

    lastSession.checkOut = today;

    await attendance.save();
    res.status(200).json({ message: "Check-out successful", attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = {
  checkIn,
  checkOut,
};
