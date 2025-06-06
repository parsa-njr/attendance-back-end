const express = require("express");
const router = express.Router();
const {
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
} = require("../../controllers/Customer/shiftController");
const requireRole = require("../../middleware/roleMiddleware");

// POST /api/v1/shifts
router.post("/customer/shifts", requireRole("customer"), createShift);

// GET /api/v1/shifts
router.get("/customer/shifts", requireRole("customer"), getAllShifts);

// GET /api/v1/customer/shifts/:id
router.get("/customer/shifts/:id", requireRole("customer"), getShiftById);

// PUT /api/v1/customer/shifts/:id
router.put("/customer/shifts/:id", requireRole("customer"), updateShift);

// DELETE /api/v1/customer/shifts/:id
router.delete("/customer/shifts/:id", requireRole("customer"), deleteShift);

module.exports = router;
