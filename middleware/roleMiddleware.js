const jwt = require("jsonwebtoken");
const {
  AuthenticationError,
  ForbiddenError,
} = require("../errors/customError");
require("dotenv").config();

const secretKey = process.env.JWT_SECRET_KEY;

const requireRole = (role) => {
  return (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      throw new AuthenticationError("no token provided");
    }

    try {
      const decoded = jwt.verify(token, secretKey);
      if (decoded.role !== role) {
        console.log(decoded.role);
        throw new ForbiddenError("forbidden");
      }
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  };
};

module.exports = requireRole;
