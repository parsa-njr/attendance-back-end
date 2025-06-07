const express = require("express");
const router = express.Router();
const shiftController = require("../../controllers/Customer/shiftController");
const requireRole = require("../../middleware/roleMiddleware");

// POST /api/v1/shifts
router.post("/customer/shifts", requireRole("customer"), shiftController?.createShift);

// GET /api/v1/shifts
router.get("/customer/shifts", requireRole("customer"), shiftController?.getAllShifts);

// GET /api/v1/customer/shifts/:shiftId
router.get("/customer/shifts/:shiftId", requireRole("customer"), shiftController?.getShiftById);

// PUT /api/v1/customer/shifts/:shiftId
router.put("/customer/shifts/:shiftId", requireRole("customer"), shiftController?.updateShift);

// DELETE /api/v1/customer/shifts/:shiftId
router.delete("/customer/shifts/:shiftId", requireRole("customer"), shiftController?.deleteShift);

module.exports = router;
