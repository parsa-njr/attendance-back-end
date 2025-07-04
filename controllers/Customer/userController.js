const User = require("../../models/user");
const Location = require("../../models/location");
const { searchFilter } = require("../../utils/search filter");
const Shift = require("../../models/shift");
const Customer = require("../../models/customer");
const {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} = require("../../errors/customError");
const { userValidation } = require("../../validations/userValidation");
const {
  updateUserValidation,
} = require("../../validations/updateUserValidation");
const { tryCatch } = require("../../utils/tryCatch");
const paginate = require("../../utils/paginate");
const bcrypt = require("bcrypt");

const createUser = tryCatch(async (req, res) => {
  const customerId = req.user.id;

  const customer = await Customer.findOne({ _id: customerId });
  if (!customer) {
    throw new NotFoundError("چنین کاربری یافت نشد");
  }

  const { error } = userValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  const { name, phone, shift, location, password } = req.body;

  const existingUser = await User.findOne({ phone });
  const userLocation = await Location.findOne({
    _id: location,
    customer: customerId,
  });
  const userShift = await Shift.findOne({ _id: shift, customer: customerId });
  if (existingUser) {
    throw new ConflictError("این شماره قبلاً استفاده شده است");
  }

  if (!userLocation) {
    throw new NotFoundError("مکان معتبر یافت نشد یا متعلق به شما نیست");
  }

  if (!userShift) {
    throw new NotFoundError("شیفت معتبر یافت نشد یا متعلق به شما نیست");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    name,
    phone,
    shift: userShift,
    location: userLocation,
    password: hashedPassword,
    customer: customerId,
  });

  customer.users.push(newUser._id);
  await customer.save();

  res.status(201).json({
    success: true,
    message: "کاربر با موفقیت ایجاد شد",
  });
});

const editUser = tryCatch(async (req, res) => {
  const customerId = req.user.id;
  const userId = req.params.userId;

  const { error } = updateUserValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  const { name, phone, password, location, shift } = req.body;

  // Ensure phone is unique (excluding this user)
  const userLocation = await Location.findOne({
    _id: location,
    customer: customerId,
  });

  const userShift = await Shift.findOne({
    _id: shift,
    customer: customerId,
  });

  const phoneTaken = await User.findOne({ phone, _id: { $ne: userId } });
  if (phoneTaken) {
    throw new ConflictError("این شماره قبلاً استفاده شده است");
  }

  if (!userLocation) {
    throw new NotFoundError("مکان معتبر یافت نشد یا متعلق به شما نیست");
  }

  if (!userShift) {
    throw new NotFoundError("شیفت معتبر یافت نشد یا متعلق به شما نیست");
  }

  // Prepare updated fields
  const updatedFields = { name, phone, location, shift };

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updatedFields.password = await bcrypt.hash(password, salt);
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, customer: customerId },
    { $set: updatedFields },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new NotFoundError("کاربر یافت نشد یا دسترسی ندارید");
  }

  res.status(200).json({
    success: true,
    message: "کاربر با موفقیت به‌روزرسانی شد",
  });
});

const deleteUser = tryCatch(async (req, res) => {
  const customerId = req.user.id;
  const userId = req.params.userId;

  const user = await User.findOne({ _id: userId, customer: customerId });

  if (!user) {
    throw new NotFoundError("کاربر یافت نشد یا دسترسی ندارید");
  }

  await User.findOneAndDelete({ _id: userId });

  await Customer.findOneAndDelete(userId, {
    $pull: { users: userId },
  });

  res.status(200).json({
    success: true,
    message: "کاربر با موفقیت حذف شد",
  });
});

const getUsers = tryCatch(async (req, res) => {
  const { search } = req.query;
  const customerId = req.user.id;

  const searchQuery = searchFilter(search, ["name", "phone"]);

  const { data, pagination } = await paginate(
    req,
    User,
    searchQuery, // only the search part
    { createdAt: -1 },
    [{ path: "location" }, { path: "shift" }],
    { customer: customerId } // base filter passed here
  );

  res.status(200).json({
    success: true,
    data: pagination
      ? {
          data,
          ...pagination,
        }
      : data,
  });
});

module.exports = {
  createUser,
  editUser,
  getUsers,
  deleteUser,
};
