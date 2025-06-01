const { NotFoundError } = require("../../errors/customError");
const { Customer } = require("../../models/customer");
const Location = require("../../models/location");
const { tryCatch } = require("../../utils/tryCatch");

// Create a new location
const createLocation = tryCatch(async (req, res) => {
  const customerId = req.user.id;
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new NotFoundError("چنین کاربری یافت نشد");
  }
  const { error } = userValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  const { name, latitude, longitude, range } = req.body;

  if (!name || latitude == null || longitude == null || range == null) {
    return res.status(400).json({ message: "خطا در ارزیابی اطلاعات" });
  }

  const newLocation = await Location.create({
    employer: customerId,
    name,
    latitude,
    longitude,
    range,
  });

  customer.locations.push(newLocation._id);
  await customer.save();
  res.status(201).json({
    success: true,
    message: "مکان با موفقیت ایجاد شد",
  });
});

// Get all locations
const getAllLocations = tryCatch(async (req, res) => {
  const customerId = req.user.id;
  const { data, pagination } = await paginate(req, Location, {
    employer: customerId,
  });
  res.json({
    success: true,
    data: pagination
      ? {
          ...pagination,
          data,
        }
      : data,
    message: "",
  });
});

// Get one location by ID
const getLocationById = tryCatch(async (req, res) => {
  const { id } = req.params;
  const location = await Location.findById(id);
  if (!location) {
    throw new NotFoundError("محل مورد نظر یافت نشد");
  }
  res.status(200).json(location);
});

// Update location
const updateLocation = tryCatch(async (req, res) => {
  const customerId = req.user.id;
  const locationId = req.params.id;

  const location = await Location.findOne({
    _id: locationId,
    employer: customerId,
  });
  if (!location) {
    throw new NotFoundError("لوکیشن یافت نشد");
  }

  const { error } = userValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  const updatedFields = { name, latitude, longitude, range };

  const updated = await Location.findByIdAndUpdate(
    { _id: locationId, employer: customerId },
    { $set: updatedFields },
    { new: true, runValidators: true }
  );
  if (!updated) {
    throw new NotFoundError("محل مورد نظر یافت نشد");
  }
  res.status(200).json({
    success: true,
    message: "لوکیشن با موفقیت به‌روزرسانی شد",
  });
});

// Delete location
const deleteLocation = async (req, res) => {
  const { id } = req.params;
  const deleted = await Location.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("محل مورد نظر یافت نشد");
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
