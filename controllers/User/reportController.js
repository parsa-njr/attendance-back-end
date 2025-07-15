const Attendance = require("../../models/attendance");
const Shift = require("../../models/shift");
const Request = require("../../models/request");
const User = require("../../models/user");

const ExcelJS = require("exceljs");
const { tryCatch } = require("../../utils/tryCatch");

const {
  generateWorkCalendar,
  calculateDetailedAttendanceReport,
  getPersianDateRange,
  summarizeAttendance,
} = require("../../utils/attendanceFunctions");

// Get attendance report
const getReport = tryCatch(async (req, res) => {
  const { month, year, excel } = req.query;
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

  const user = await User.findById(userId);

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

  // ➤ If Excel export is requested
  if (excel === "true") {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    // Define columns based on your finalReport structure
    worksheet.columns = [
      { header: "تاریخ", key: "date", width: 15 },
      { header: "ساعت شروع مورد انتظار", key: "expectedStart", width: 20 },
      { header: "ساعت پایان مورد انتظار", key: "expectedEnd", width: 20 },
      { header: "وضعیت", key: "status", width: 15 },
    ];

    // Add each row
    finalReport.forEach((item) => {
      worksheet.addRow({
        date: item.date,
        expectedStart: item.expectedStart || "-",
        expectedEnd: item.expectedEnd || "-",
        status: item.status || "-",
      });
    });

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.eachRow((row) => {
      row.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Set download headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance-${month}-${year}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
    return;
  }

  // ➤ Default: return JSON
  return res.status(200).json({
    success: true,
    calendar,
    totalReport,
    finalReport,
    attendances,
    shift: shifts,
    requests,
  });
});

module.exports = {
  getReport,
};
