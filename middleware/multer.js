const multer = require("multer");
const path = require("path");

// Setup storage
const profileImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./images/profile-images"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const uploadProfileImage = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // optional: 5MB limit
});

module.exports = {
  uploadProfileImage,
};
