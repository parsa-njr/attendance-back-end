const Attendance = require("../../models/attendance");
const Shift = require("../../models/shift");
const Request = require("../../models/request");

const { tryCatch } = require("../../utils/tryCatch");
const User = require("../../models/user");
const {
  generateWorkCalendar,
  calculateDetailedAttendanceReport,
  getPersianDateRange,
  summarizeAttendance,
} = require("../../utils/attendanceFunctions");

// Get attendance report
const getReport = tryCatch(async (req, res) => {
  const { month, year } = req.query;
  const userId = req.user?.id;

  const user = await User.findById(userId);
  console.log("user : ", user);

  if (!month || !year || !userId) {
    return res.status(400).json({
      success: false,
      message: "Month, year, and user ID are required.",
    });
  }

  const jYear = parseInt(year, 10);
  const jMonth = parseInt(month, 10);

  let startDate, endDate, daysInMonth;
  try {
    ({ startDate, endDate, daysInMonth } = getPersianDateRange(jYear, jMonth));
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Invalid Jalali date",
    });
  }

  console.log("startDate : ", startDate);
  console.log("endDate : ", endDate);
  console.log("daysInMonth : ", daysInMonth);

  // Fetch all data in parallel
  const [attendances, shifts, requests] = await Promise.all([
    Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 }),
    Shift.findById(user?.shift),
    Request.find({
      creator: userId,
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        { date: { $gte: startDate, $lte: endDate } },
      ],
    }),
  ]);

  const calendar = generateWorkCalendar(shifts);
  const finalReport = calculateDetailedAttendanceReport(
    calendar,
    attendances,
    requests,
    shifts
  );
 const totalReport = summarizeAttendance(finalReport)

  return res.status(200).json({
    success: true,
    calendar,
    totalReport,
    finalReport,
    attendances: attendances,
    shift: shifts,
    requests: requests,
  });
});

module.exports = {
  getReport,
};
