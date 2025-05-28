const { NotFoundError } = require("../../errors/customError");
const Location = require("../../models/location");

// Create a new location
const createLocation = async (req, res) => {
  const { name, latitude, longitude, range } = req.body;

  if (!name || latitude == null || longitude == null || range == null) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const location = await Location.create({ name, latitude, longitude, range });
  res.status(201).json(location);
};

// Get all locations
const getAllLocations = async (req, res) => {
  const locations = await Location.find();
  res.status(200).json(locations);
};

// Get one location by ID
const getLocationById = async (req, res) => {
  const { id } = req.params;
  const location = await Location.findById(id);
  if (!location) {
    throw new NotFoundError("محل مورد نظر یافت نشد") 
  }
  res.status(200).json(location);
};

// Update location
const updateLocation = async (req, res) => {
  const { id } = req.params;
  const updated = await Location.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) {
    throw new NotFoundError("محل مورد نظر یافت نشد") 
  }
  res.status(200).json(updated);
};

// Delete location
const deleteLocation = async (req, res) => {
  const { id } = req.params;
  const deleted = await Location.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("محل مورد نظر یافت نشد") 
  }
  res.status(200).json({ message: "محل مورد نظر با موفقیت حذف شد" });
};

module.exports = {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
};
