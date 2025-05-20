const { Router } = require("express");
const router = Router();
const predictController = require("../controllers/predictController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/predict", upload.none(), predictController.predictAttendance);

module.exports = router;
