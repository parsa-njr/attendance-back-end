const { tryCatch } = require("../utils/tryCatch");
const fastapiService = require("../services/fastapi");

const predictAttendance = tryCatch(async (req, res) => {
  // داده‌های هاردکد شده برای یک هفته
  const weeklyAttendanceData = {
    employee_id: "EMP-001",
    week_start_date: "2025-05-19",
    daily_records: [
      { date: "2025-05-19", expected_entry: "09:00", worked_hours: 8, delay_minutes: 5 },
      { date: "2025-05-20", expected_entry: "09:00", worked_hours: 7.5, delay_minutes: 10 },
      { date: "2025-05-21", expected_entry: "09:00", worked_hours: 0, delay_minutes: 0 },
      { date: "2025-05-22", expected_entry: "09:00", worked_hours: 8, delay_minutes: 0 },
      { date: "2025-05-23", expected_entry: "09:00", worked_hours: 6, delay_minutes: 20 },
      { date: "2025-05-24", expected_entry: "09:00", worked_hours: 0, delay_minutes: 0 },
      { date: "2025-05-25", expected_entry: "09:00", worked_hours: 8, delay_minutes: 0 },
    ],
  };

  const dailyPredictions = [];

  for (const day of weeklyAttendanceData.daily_records) {
    const requestData = {
      employee_id: weeklyAttendanceData.employee_id,
      target_date: day.date,
      expected_entry: day.expected_entry,
      worked_hours_last_day: day.worked_hours,
      avg_delay_7days: day.delay_minutes, // یا محاسبه میانگین تاخیر 7 روز
    };

    try {
      const predictionResult = await fastapiService.predict(requestData);
      dailyPredictions.push({
        date: day.date,
        late_or_absent_probability: predictionResult.late_or_absent_probability || 0,
        report: predictionResult.report || "",
      });
    } catch (error) {
      dailyPredictions.push({
        date: day.date,
        late_or_absent_probability: null,
        report: "خطا در پیش‌بینی",
      });
    }
  }

  res.status(200).json({
    success: true,
    employee_id: weeklyAttendanceData.employee_id,
    week_start_date: weeklyAttendanceData.week_start_date,
    predictions: dailyPredictions,
  });
});

module.exports = { predictAttendance };
