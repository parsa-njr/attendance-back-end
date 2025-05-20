const jwt = require("jsonwebtoken");
const {
  AuthenticationError,
  ForbiddenError,
} = require("../errors/customError");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  const tokenWithoutPrefix = token ? token.slice(7) : null;
  const secretKey = process.env.JWT_SECRET_KEY;

  if (!token) {
    throw new AuthenticationError("no token provided");
  }

  jwt.verify(tokenWithoutPrefix, secretKey, (err, decoded) => {
    if (err) {
      console.log("Token:", token);
      console.log("Error:", err);
      throw new ForbiddenError("Failed to authenticate token");
    }
    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
