const User = require("../../models/user");
const Customer = require("../../models/customer");
const {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} = require("../../errors/customError");
const { profileValidation } = require("../../validations/profileValidation");
const { tryCatch } = require("../../utils/tryCatch");
const bcrypt = require("bcrypt");

const editProfile = tryCatch(async (req, res) => {
  const userId = req.user.id;

  const { error } = profileValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  const { name, phone, password } = req.body;
  const updatedFields = { name, phone };

  // Check if the phone exists in customers
  const existingCustomer = await Customer.findOne({ phone });
  if (existingCustomer) {
    throw new ConflictError(
      "این شماره قبلاً توسط یک کاربر دیگر استفاده شده است"
    );
  }

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updatedFields.password = await bcrypt.hash(password, salt);
  }

  if (req.file) {
    updatedFields.profileImage = `/uploads/profile-images/${req.file.filename}`;
  }

  try {
    await User.findOneAndUpdate(
      { _id: userId },
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "پروفایل با موفقیت ویرایش شد",
    });
  } catch (err) {
    if (
      err.name === "MongoServerError" &&
      err.code === 11000 &&
      err.keyPattern?.phone
    ) {
      throw new ConflictError(
        "این شماره قبلاً توسط یک کاربر دیگر استفاده شده است"
      );
    }

    throw err;
  }
});

const getProfile = tryCatch(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new NotFoundError("چنین کاربری یافت نشد");
  }

  res.status(200).json({
    user,
    success: true,
  });
});

module.exports = {
  editProfile,
  getProfile,
};
