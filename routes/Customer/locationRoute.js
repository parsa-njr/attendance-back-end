const express = require("express");
const router = express.Router();
const {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} = require("../../controllers/Customer/locationController");
const requireRole = require("../../middleware/roleMiddleware");

// POST /api/v1/customer/locations
router.post("/customer/locations", requireRole("customer"), createLocation);

// GET /api/v1/customer/locations
router.get("/customer/locations", requireRole("customer"), getAllLocations);

// GET /api/v1/customer/locations/:id
router.get("/customer/locations/:id", requireRole("customer"), getLocationById);

// PUT /api/v1/customer/locations/:id
router.put("/customer/locations/:id", requireRole("customer"), updateLocation);

// DELETE /api/v1/customer/locations/:id
router.delete("/customer/locations/:id", requireRole("customer"), deleteLocation);

module.exports = router;
