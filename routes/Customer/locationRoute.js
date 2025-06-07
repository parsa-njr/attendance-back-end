const express = require("express");
const router = express.Router();
const locationController = require("../../controllers/Customer/locationController");
const requireRole = require("../../middleware/roleMiddleware");

// POST /api/v1/customer/locations
router.post("/customer/locations", requireRole("customer"), locationController?.createLocation);

// GET /api/v1/customer/locations
router.get("/customer/locations", requireRole("customer"), locationController?.getAllLocations);

// GET /api/v1/customer/locations/:locationId
router.get("/customer/locations/:locationId", requireRole("customer"), locationController?.getLocationById);

// PUT /api/v1/customer/locations/:locationId
router.put("/customer/locations/:locationId", requireRole("customer"), locationController?.updateLocation);

// DELETE /api/v1/customer/locations/:locationId
router.delete("/customer/locations/:locationId", requireRole("customer"), locationController?.deleteLocation);

module.exports = router;
