const {
  UnprocessableEntityError,
  NotFoundError,
} = require("../../errors/customError");
const Attendance = require("../../models/attendance");
const Location = require("../../models/location");
const User = require("../../models/user");
const getDistanceMeters = require("../../utils/getDistanceMeters");
const { tryCatch } = require("../../utils/tryCatch");

const checkIn = tryCatch(async (req, res) => {
  const userId = req.user.id;
  const { lat, lng } = req.body;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const user = await User.findById(userId).populate("location");
  const location = user.location;

  if (!location) {
    throw new NotFoundError("محل کار یافت نشد");
  }

  const distance = getDistanceMeters(
    lat,
    lng,
    location.latitude,
    location.longitude
  );

  console.log("distance : ", distance);
  console.log("location.range : ", location.range);

  if (distance > location.range) {
    throw new UnprocessableEntityError("شما در محل نیستید");
  }

  let attendance = await Attendance.findOne({ user: userId, date: todayStr });
  if (!attendance) {
    attendance = new Attendance({
      user: userId,
      date: todayStr,
      sessions: [],
    });
  }

  const lastSession = attendance.sessions[attendance.sessions.length - 1];
  if (lastSession && !lastSession.checkOut) {
    throw new UnprocessableEntityError("ورود شما از قبل ثبت شده است");
  }

  attendance.sessions.push({ checkIn: today });

  await attendance.save();
  res
    .status(201)
    .json({ success: true, message: "ورود با موفقیت ثبت شد", attendance });
});

const checkOut = tryCatch(async (req, res) => {
  const userId = req.user.id;
  const { lat, lng } = req.body;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const user = await User.findById(userId).populate("location");
  const location = user.location;
  if (!location) {
    throw new NotFoundError("محل کار یافت نشد");
  }

  const distance = getDistanceMeters(
    lat,
    lng,
    location.latitude,
    location.longitude
  );

  if (distance > location.range) {
    throw new UnprocessableEntityError("شما در محل نیستید");
  }

  const attendance = await Attendance.findOne({
    user: userId,
    date: todayStr,
  });

  if (!attendance || attendance.sessions.length === 0) {
    throw new UnprocessableEntityError("ابتدا ورود خود را ثبت کنید");
  }

  const lastSession = attendance.sessions[attendance.sessions.length - 1];
  if (lastSession.checkOut) {
    throw new UnprocessableEntityError("خروج شما از قبل ثبت شده است");
  }

  lastSession.checkOut = today;

  await attendance.save();
  res
    .status(201)
    .json({ success: true, message: "خروج با موفقیت ثبت شد", attendance });
});

module.exports = {
  checkIn,
  checkOut,
};
