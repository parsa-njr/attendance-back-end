const { tryCatch } = require("../utils/tryCatch");
const fastapiService = require("../services/fastapi");

// آموزش مدل برای کارمند
const trainAttendanceModel = tryCatch(async (req, res) => {
  const response = await fastapiService.trainModel(req.body);
  res.status(200).json(response);
});

// پیش‌بینی با مدل
const predictAttendance = tryCatch(async (req, res) => {
  const response = await fastapiService.predict(req.body);
  res.status(200).json(response);
});

module.exports = { trainAttendanceModel, predictAttendance };
