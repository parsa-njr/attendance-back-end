const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
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
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: true,
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shift",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.statics.login = async function (phone, password) {
  const user = await this.findOne({ phone });
  if (user) {
    console.log(user.password);
    console.log(password);
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw new Error("نام کاربری یا رمز عبور اشتباه است");
  }
  throw new Error("نام کاربری یا رمز عبور اشتباه است");
};

userSchema.statics.mobileLogin = async function (mobile, code) {
  const user = await this.findOne({ mobile });
  if (user) {
    if (user.loginVerificationCode === code) {
      return user;
    }
    throw new Error("the code you have sent is not valid");
  }
  throw new Error("mobile or password is wrong");
};

const User = mongoose.model("User", userSchema);

module.exports = User;
