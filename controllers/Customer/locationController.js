const Customer  = require("../../models/customer");
const Location = require("../../models/location");
const { tryCatch } = require("../../utils/tryCatch");
const {
  NotFoundError,
  UnprocessableEntityError,
} = require("../../errors/customError");
const paginate = require("../../utils/paginate");
const { locationValidation } = require("../../validations/locationValidation");

//
// ────────────────────────────────────────────────────────────────────────────────
// 📍 Create a new location
//
const createLocation = tryCatch(async (req, res) => {
  console.log("req ::: ", req);

  // Step 1: Check if the customer exists
  const customerId = req.user.id;
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new NotFoundError("چنین کاربری یافت نشد");
  }

  // Step 2: Validate request body with Joi
  const { error } = locationValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  // Step 3: Destructure validated fields
  const { name, latitude, longitude, range } = req.body;


  // Step 4: Create the new location
  await Location.create({
    customer: customerId,
    name,
    latitude,
    longitude,
    range,
  });

  // Step 5: Send success response
  res.status(201).json({
    success: true,
    message: "مکان با موفقیت ایجاد شد",
  });
});

//
// ────────────────────────────────────────────────────────────────────────────────
// 📍 Get all locations for the current logged-in customer (with pagination)
//
const getAllLocations = tryCatch(async (req, res) => {
  const customerId = req.user.id;

  // Paginate locations filtered by customer
  const { data, pagination } = await paginate(req, Location, {
    customer: customerId,
  });

  res.status(200).json({
    success: true,
    data: pagination
      ? {
          ...pagination,
          data,
        }
      : data,
  });
});

//
// ────────────────────────────────────────────────────────────────────────────────
// 📍 Get a single location by ID
//
const getLocationById = tryCatch(async (req, res) => {
  const locationId = req.params?.locationId;

  // Find location by ID
  const location = await Location.findById(locationId);
  if (!location) {
    throw new NotFoundError("محل مورد نظر یافت نشد");
  }

  res.status(200).json({
    success: true,
    data: location,
  });
});

//
// ────────────────────────────────────────────────────────────────────────────────
// 📍 Update a location
//
const updateLocation = tryCatch(async (req, res) => {
  const locationId = req.params.locationId;
  const customerId = req.user.id;

  // Step 1: Check if customer exists
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new NotFoundError("چنین کاربری یافت نشد");
  }


  // Step 2: Validate request data
  const { error } = locationValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  // Step 3: Update the location
  const { name, latitude, longitude, range } = req.body;
  const updated = await Location.findOneAndUpdate(
    { _id: locationId, customer: customerId },
    { $set: { name, latitude, longitude, range } },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new NotFoundError("لوکیشن مورد نظر یافت نشد");
  }

  res.status(200).json({
    success: true,
    message: "لوکیشن با موفقیت به‌روزرسانی شد",
  });
});

//
// ────────────────────────────────────────────────────────────────────────────────
// 📍 Delete a location
//
const deleteLocation = async (req, res) => {
  const locationId = req.params?.locationId;

  // Find and delete the location
  const deleted = await Location.findByIdAndDelete(locationId);
  if (!deleted) {
    throw new NotFoundError("محل مورد نظر یافت نشد");
  }

  res
    .status(200)
    .json({ success: true, message: "محل مورد نظر با موفقیت حذف شد" });
};

//
// ────────────────────────────────────────────────────────────────────────────────
// 📤 Export controllers
//
module.exports = {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
};
