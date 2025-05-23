const { Router } = require("express");
const router = Router();
const authController = require("../../controllers/Auth/authController");
const multer = require("multer");


// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/sign-up", upload.none(), authController.signUp);
router.post("/login", upload.none() ,  authController.login);

module.exports = router;
