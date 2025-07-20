const Customer = require("../../models/customer");
const User = require("../../models/user");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const { tryCatch } = require("../../utils/tryCatch");
const {
  signupValidation,
  loginValidation,
} = require("../../validations/authValidation");
const {
  UnprocessableEntityError,
  AuthenticationError,
  NotFoundError,
} = require("../../errors/customError");
const bcrypt = require("bcrypt");
require("dotenv").config();
const secretKey = process.env.JWT_SECRET_KEY;

const createToken = (id, role) => {
  return jwt.sign({ id, role }, secretKey);
};

const signUp = tryCatch(async (req, res) => {
  const { error } = signupValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(", ");
    throw new UnprocessableEntityError(errorMessage);
  }

  const newCustomer = new Customer(req.body);
  await newCustomer.save();
  const token = createToken(newCustomer._id, "customer");

  res.status(201).json({
    message: "شما با موفقیت ثبت نام کردید",
    token,
    user: {
      id: newCustomer._id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      role: "customer",
      profileImage: newCustomer.profileImage,
    },
    success: true,
  });
});

const login = tryCatch(async (req, res) => {
  const { error } = loginValidation.validate(req.body);
  if (error) {
    const errorMessages = error.details.map((e) => e.message).join(", ");
    throw new UnprocessableEntityError(errorMessages);
  }

  const { phone, password } = req.body;

  let account = null;
  let role = null;

  // Try to login as User
  const user = await User.findOne({ phone });
  if (user) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AuthenticationError("شماره تماس یا رمز عبور اشتباه است");
    }
    account = user;
    role = "user";
  } else {
    // Try to login as Customer
    const customer = await Customer.findOne({ phone });
    if (!customer) {
      throw new NotFoundError("حساب کاربری با این شماره وجود ندارد");
    }
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      throw new AuthenticationError("شماره تماس یا رمز عبور اشتباه است");
    }
    account = customer;
    role = "customer";
  }

  const token = createToken(account._id, role);

  res.status(200).json({
    message: "شما با موفقیت وارد شدید",
    success: true,
    token,
    user: {
      id: account._id,
      name: account.name,
      phone: account.phone,
      role,
    },
  });
});

const logout = tryCatch(async (req, res) => {
  res.status(200).json({
    message: "شما با موفقیت خارج شدید",
    success: true,
    token: null,
  });
});

const checkLogin = async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(400).json({ message: "Token is missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let account;

    if (decoded.role === "user") {
      account = await User.findById(decoded.id);
    } else if (decoded.role === "customer") {
      account = await Customer.findById(decoded.id);
    }

    if (!account) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: account._id,
        name: account.name,
        phone: account.phone,
        role: decoded.role,
        profileImage: account.profileImage || null,
      },
      token,
    });
  } catch (error) {
    console.error("checkLogin error:", error);
    res.status(401).json({ message: "Token is invalid" });
  }
};

module.exports = {
  signUp,
  login,
  logout,
  checkLogin,
};
