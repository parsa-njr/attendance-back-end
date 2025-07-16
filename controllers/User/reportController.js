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
  const userId = "6876664887f949c140d4ca6c";

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
  const finalReport = calculateDetailedAttendanceReport(calendar, attendances, requests, shifts);
  const totalReport = summarizeAttendance(finalReport);

  // === Excel file generation ===
  if (excel === "true") {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance Report");

    // Section 1: Summary Table
    worksheet.addRow(["📊 گزارش خلاصه"]);
    worksheet.addRow([]);

    worksheet.addRow(["شاخص", "مقدار"]).font = { bold: true };
    Object.entries(totalReport).forEach(([key, value]) => {
      if (typeof value === "string") {
        worksheet.addRow([convertKeyToLabel(key), value]);
      }
    });

    worksheet.addRow([]);
    worksheet.addRow(["وضعیت‌ها", "تعداد روز"]).font = { bold: true };
    Object.entries(totalReport.statusCount || {}).forEach(([status, count]) => {
      worksheet.addRow([convertKeyToLabel(status), count]);
    });

    // Section 2: Detailed Daily Report
    worksheet.addRow([]);
    worksheet.addRow(["📅 جزئیات روزانه"]);
    worksheet.addRow([
      "تاریخ",
      "ساعت شروع مورد انتظار",
      "ساعت پایان مورد انتظار",
      "وضعیت",
    ]).font = { bold: true };

    finalReport.forEach((item) => {
      worksheet.addRow([
        item.date,
        item.expectedStart || "-",
        item.expectedEnd || "-",
        convertKeyToLabel(item.status),
      ]);
    });

    worksheet.columns.forEach((col) => {
      col.alignment = { vertical: "middle", horizontal: "center" };
      col.width = 25;
    });

    worksheet.getRow(1).font = { bold: true, size: 14 };

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

  // === Default: Return JSON
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

// Helper to translate keys
function convertKeyToLabel(key) {
  const labels = {
    totalPlannedTime: "مجموع زمان برنامه‌ریزی‌شده",
    totalActualTime: "مجموع زمان واقعی حضور",
    totalLeaveTime: "مجموع زمان مرخصی",
    totalOvertime: "مجموع اضافه‌کاری",
    totalDelay: "مجموع تأخیر",
    totalDeficit: "مجموع کسری زمان",
    averageDailyOvertime: "میانگین روزانه اضافه‌کاری",
    averageDailyDelay: "میانگین روزانه تأخیر",
    averageDailyDeficit: "میانگین روزانه کسری",

    fullPresent: "حضور کامل",
    delay: "تأخیر",
    deficit: "کسری",
    absent: "غیبت",
    leave: "مرخصی",
    shiftOffDay: "روز غیرکاری",

    date: "تاریخ",
    expectedStart: "ساعت شروع مورد انتظار",
    expectedEnd: "ساعت پایان مورد انتظار",
    status: "وضعیت",
  };
  return labels[key] || key;
}


module.exports = {
  getReport,
};
