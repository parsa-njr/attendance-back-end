const { User } = require("../../models/user");
const { Customer } = require("../../models/customer");
const {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} = require("../../errors/customError");
const { userValidation } = require("../../validations/userValidation");
const { tryCatch } = require("../../utils/tryCatch");
const paginate = require("../../utils/paginate");
const bcrypt = require("bcrypt");

const createUser = tryCatch(async (req, res) => {
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

  const { name, phone, password } = req.body;

  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new ConflictError("این شماره قبلاً استفاده شده است");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const image = req.file
    ? `/uploads/profile-images/${req.file.filename}`
    : null;

  const newUser = await User.create({
    name,
    phone,
    profileImage: image,
    password: hashedPassword,
    employer: customerId,
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

  const user = await User.findOne({ _id: userId, employer: customerId });
  if (!user) {
    throw new NotFoundError("کاربر یافت نشد یا دسترسی ندارید");
  }

  const { error } = userValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  const { name, phone, password } = req.body;

  // Check for phone uniqueness excluding current user
  const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
  if (existingUser) {
    throw new ConflictError("این شماره قبلاً استفاده شده است");
  }

  const updatedFields = { name, phone };

  // Update password if inserted
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updatedFields.password = await bcrypt.hash(password, salt);
  }

  // Update image if uploaded
  if (req.file) {
    updatedFields.image = `/uploads/profile-images/${req.file.filename}`;
  }

  await User.findOneAndUpdate(
    { _id: userId, employer: customerId },
    { $set: updatedFields },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "کاربر با موفقیت به‌روزرسانی شد",
  });
});

const getUsers = tryCatch(async (req, res) => {
  const customerId = req.user.id;
  const { data, pagination } = await paginate(req, User, {
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

module.exports = {
  createUser,
  editUser,
  getUsers,
};
