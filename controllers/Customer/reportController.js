const Attendance = require("../../models/attendance");
const Shift = require("../../models/shift");
const Request = require("../../models/request");
const moment = require("moment-jalaali");
const { tryCatch } = require("../../utils/tryCatch");
const User = require("../../models/user");
const {
  generateWorkCalendar,
  calculateDetailedAttendanceReport,
  getPersianDateRange,
  summarizeAttendance,
} = require("../../utils/attendanceFunctions");
const paginate = require("../../utils/paginate");


function buildAttendanceReport(start, end, users, attendanceMap, requestsMap) {
  const report = [];

  for (let m = moment(start); m.isSameOrBefore(end); m.add(1, "day")) {
    const day = m.clone();
    const dateReport = { date: day.format("YYYY-MM-DD"), users: [] };

    for (const user of users) {
      const shift = user.shift;

      // 1️⃣ Generate shift work calendar for this user's shift plan
      const shiftConfig = {
        startDate: start,
        endDate: end,
        shiftDays: shift.shiftDays,
        exceptionDays: shift.exceptionDays,
      };

      const workCalendar = generateWorkCalendar(shiftConfig);

      // 2️⃣ Extract this user's attendances for this date
      const key = `${user._id}_${day.format("YYYY-MM-DD")}`;
      const sessions = attendanceMap.get(key) || [];

      const attendanceRecords = [
        {
          date: day.toDate(),
          sessions,
        },
      ];

      // 3️⃣ Extract this user's requests for this date (optional)
      const userRequests = requestsMap.get(user._id) || [];

      // 4️⃣ Run detailed calculation for this day only
      const detailedReport = calculateDetailedAttendanceReport(
        workCalendar,
        attendanceRecords,
        userRequests,
        shiftConfig
      ).find((r) => r.date === day.format("YYYY-MM-DD"));

      dateReport.users.push({
        userId: user._id,
        name: user.name,
        shift: detailedReport
          ? {
              isOffDay: detailedReport.isOffDay,
              expectedStart: detailedReport.expectedStart,
              expectedEnd: detailedReport.expectedEnd,
            }
          : null,
        attendance: sessions,
        report: detailedReport,
      });
    }

    report.push(dateReport);
  }

  return report;
}




const getUsersBaseLocation = tryCatch(async (req, res) => {
  const customerId = req.user.id;
  const { locationId } = req.params;

  const { data, pagination } = await paginate(
    req,
    User,
    { customer: customerId, location: locationId },
    { createdAt: -1 }
  );

  res.status(200).json({
    success: true,
    data: pagination
      ? {
          data,
          ...pagination,
        }
      : data,
  });
});
// Get attendance report
const getUserBaseReport = tryCatch(async (req, res) => {
  const { startDate, endDate, userId } = req.query;

  const user = await User.findById(userId);
  console.log("user : ", user);


  console.log("startDate : ", startDate);
  console.log("endDate : ", endDate);

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
  const totalReport = summarizeAttendance(finalReport);

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

const getDateBaseLocation = tryCatch(async (req, res) => {
  const { startDate, endDate, userId, location } = req.query;
  const customer = req.user.id;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "startDate and endDate are required" });
  }

  const userFilter = {};

  if (userId) {
    userFilter._id = userId;
  } else {
    if (customer) userFilter.customer = customer;
    if (location) userFilter.location = location;
  }

  // 1️⃣ Find users
  const users = await User.find(userFilter).populate("shift");

  if (!users.length) {
    return res.status(404).json({ message: "No users found." });
  }

const start = moment.utc(startDate).startOf("day");
const end = moment.utc(endDate).endOf("day");

  // 2️⃣ Get ALL attendance data in bulk
  const attendances = await Attendance.find({
    user: { $in: users.map((u) => u._id) },
    date: { $gte: start.toDate(), $lte: end.toDate() },
  }).lean();

  // 1️⃣ Group by userId + date
const attendanceMap = new Map();
for (const att of attendances) {
  const key = `${att.user}_${moment(att.date).format("YYYY-MM-DD")}`;
  attendanceMap.set(key, att.sessions);
}

// ✅ 2️⃣ THEN: Get requests ONCE for all users
const requests = await Request.find({
  creator: { $in: users.map((u) => u._id) },
  startDate: { $lte: end.toDate() },
  endDate: { $gte: start.toDate() },
}).lean();

const requestsMap = new Map();
for (const req of requests) {
  if (!requestsMap.has(req.creator)) {
    requestsMap.set(req.creator, []);
  }
  requestsMap.get(req.creator).push(req);
}

// ✅ 3️⃣ Build report
const report = buildAttendanceReport(start, end, users, attendanceMap, requestsMap);


  return res.json(report);
});

// Helper
function getShiftForDate(shift, date) {
  const weekday = date.isoWeekday();

  const exception = shift.exceptionDays.find((e) =>
    moment.utc(e.date).isSame(date, "day")
  );

  if (exception) {
    return { isOffDay: false, time: exception.time };
  }

  const shiftDay = shift.shiftDays.find((d) => d.day === weekday);
  if (shiftDay) {
    return { isOffDay: shiftDay.isOffDay, time: shiftDay.time };
  }

  return { isOffDay: true, time: [] };
}

module.exports = {
  getUserBaseReport,
  getUsersBaseLocation,
  getDateBaseLocation,
};
