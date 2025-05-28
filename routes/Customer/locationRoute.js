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

// POST /api/v1/locations
router.post("/locations", requireRole("customer"), createLocation);

// GET /api/v1/locations
router.get("/locations", requireRole("customer"), getAllLocations);

// GET /api/v1/locations/:id
router.get("/locations/:id", requireRole("customer"), getLocationById);

// PUT /api/v1/locations/:id
router.put("/locations/:id", requireRole("customer"), updateLocation);

// DELETE /api/v1/locations/:id
router.delete("/locations/:id", requireRole("customer"), deleteLocation);

module.exports = router;
