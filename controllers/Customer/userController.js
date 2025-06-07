const User  = require("../../models/user");
const Customer  = require("../../models/customer");
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

  const customer = await Customer.findOne({_id : customerId});
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

  const { error } = userValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  const { name, phone, password } = req.body;

  // Ensure phone is unique (excluding this user)
  const phoneTaken = await User.findOne({ phone, _id: { $ne: userId } });
  if (phoneTaken) {
    throw new ConflictError("این شماره قبلاً استفاده شده است");
  }

  // Prepare updated fields
  const updatedFields = { name, phone };

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updatedFields.password = await bcrypt.hash(password, salt);
  }

  if (req.file) {
    updatedFields.image = `/uploads/profile-images/${req.file.filename}`;
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, employer: customerId },
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

  const user = await User.findOne({ _id: userId, employer: customerId });

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
  const customerId = req.user.id;
  const { data, pagination } = await paginate(req, User, {
    employer: customerId,
  });

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
