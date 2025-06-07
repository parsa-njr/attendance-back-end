const User  = require("../../models/user");
const Customer  = require("../../models/customer");
const {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} = require("../../errors/customError");
const { profileValidation } = require("../../validations/profileValidation");
const { tryCatch } = require("../../utils/tryCatch");
const bcrypt = require("bcrypt");

const editProfile = tryCatch(async (req, res) => {
  const customerId = req.user.id;

  const { error } = profileValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  const { name, phone, password } = req.body;

  // Check for phone uniqueness excluding current user
  const existingUser = await Customer.findOne({
    phone,
    _id: { $ne: customerId },
  });
  if (existingUser) {
    throw new ConflictError("این شماره قبلاً استفاده شده است");
  }

  const updatedFields = { name, phone, password };

  // Update password if inserted
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updatedFields.password = await bcrypt.hash(password, salt);
  }

  // Update image if uploaded
  if (req.file) {
    updatedFields.profileImage = `/uploads/profile-images/${req.file.filename}`;
  }

  await Customer.findOneAndUpdate(
    { _id: customerId },
    { $set: updatedFields },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "پروفایل با موفقیت ویرایش شد",
  });
});

const getProfile = tryCatch(async (req, res) => {
  const customerId = req.user.id;

  const customer = await Customer.findOne({ _id: customerId });

  if (!customer) {
    throw new NotFoundError("چنین کاربری یافت نشد");
  }

  res.status(200).json({
    customer,
    success: true,
  });
});

module.exports = {
  editProfile,
  getProfile,
};
