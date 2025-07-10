const { Router } = require("express");
const router = Router();
const authController = require("../../controllers/Auth/authController");
const multer = require("multer");

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/sign-up", authController.signUp);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

module.exports = router;
