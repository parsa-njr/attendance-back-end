const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { ConflictError } = require("../errors/customError");
const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: null,
    required: false,
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

customerSchema.pre("save", async function (next) {
  if (this.isNew) {
    const existingUser = await mongoose.models.Customer.findOne({
      phone: this.phone,
    });

    if (existingUser) {
      throw new ConflictError("چنین کاربری وجود دارد");
    }
  }

  if (this.isModified("password") || this.isNew) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

customerSchema.statics.mobileLogin = async function (phone, code) {
  const user = await this.findOne({ phone });
  if (user) {
    if (user.loginVerificationCode === code) {
      return user;
    }
    throw new Error("the code you have sent is not valid");
  }
  throw new Error("phone or password is wrong");
};

const Customer = mongoose.model("Customer", customerSchema);

module.exports = { Customer };
