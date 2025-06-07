const express = require("express");
const router = express.Router();
const attendanceController = require("../../controllers/User/attendanceController");
const requireRole = require("../../middleware/roleMiddleware");

router.post("/user/checkIn", requireRole("user"), attendanceController.checkIn);
router.post( "/user/checkOut",requireRole("user"),attendanceController.checkOut);

module.exports = router;
