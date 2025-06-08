const Attendance = require("../../models/attendance");
const Shift = require("../../models/shift");
const Request = require("../../models/request");
const { format } = require("date-fns");
const { toGregorian, jalaaliMonthLength } = require("jalaali-js");
const { tryCatch } = require("../../utils/tryCatch");

// Format time to readable string
const formatTime = (date) => (!date ? "--:--" : format(date, "hh:mm a"));

// Convert minutes to "Xh Ym"
const formatMinutesToXhYm = (minutes) => {
  if (!minutes || isNaN(minutes)) return "0h";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
};

// Convert "HH:MM" to total minutes
const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === "--:--") return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

// Convert Jalali month to Gregorian date range
const getPersianDateRange = (jYear, jMonth) => {
  if (!Number.isInteger(jYear) || !Number.isInteger(jMonth)) {
    throw new Error("Invalid Jalali year or month");
  }

  const startGreg = toGregorian(jYear, jMonth, 1);
  const daysInMonth = jalaaliMonthLength(jYear, jMonth);
  const endGreg = toGregorian(jYear, jMonth, daysInMonth);

  const startDate = new Date(
    Date.UTC(startGreg.gy, startGreg.gm - 1, startGreg.gd, 0, 0, 0)
  );
  const endDate = new Date(
    Date.UTC(endGreg.gy, endGreg.gm - 1, endGreg.gd, 0, 0, 0)
  );

  return { startDate, endDate, daysInMonth };
};

// Get attendance report
const getReport = tryCatch(async (req, res) => {
  const { month, year } = req.query;
  const userId = req.user?.id;

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
    Shift.find({ employee: userId }),
    Request.find({
      employee: userId,
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        { date: { $gte: startDate, $lte: endDate } },
      ],
    }),
  ]);

  console.log("attendances : ", attendances);

  const reportData = attendances.map((attendance) => {
    const dayOfWeek = attendance.date.getDay();
    const shift = shifts.find((s) => s.days.includes(dayOfWeek));

    const checkInMinutes = timeToMinutes(attendance.checkIn);
    const checkOutMinutes = timeToMinutes(attendance.checkOut);

    const workedMinutes =
      checkInMinutes && checkOutMinutes
        ? checkOutMinutes - checkInMinutes - (attendance.breakMinutes || 0)
        : 0;

    const absentHours =
      !attendance.checkIn || !attendance.checkOut
        ? formatMinutesToXhYm(shift?.durationMinutes ?? 480) // default 8h
        : "0h";

    const dayRequests = requests.filter((request) => {
      const targetDate = attendance.date;
      if (request.date) {
        return request.date.toDateString() === targetDate.toDateString();
      }
      return request.startDate <= targetDate && request.endDate >= targetDate;
    });

    return {
      jalaliDate: `${jYear}/${jMonth}/${attendance.date.getDate()}`,
      gregorianDate: format(attendance.date, "yyyy-MM-dd"),
      workedHours: formatMinutesToXhYm(workedMinutes),
      absentHours,
      checkIn: attendance.checkIn || "--:--",
      checkOut: attendance.checkOut || "--:--",
      shifts: shift
        ? [
            {
              startTime: shift.startTime,
              endTime: shift.endTime,
              title: shift.name,
            },
          ]
        : [],
      requests: dayRequests.map((req) => ({
        type: req.type,
        status: req.status,
        hours: `${req.hours ?? 0}h`,
      })),
    };
  });

  return res.status(200).json({
    success: true,
    data: reportData,
    attendances: attendances,
    meta: {
      persianYear: jYear,
      persianMonth: jMonth,
      totalDays: daysInMonth,
    },
  });
});

module.exports = {
  getReport,
};
