const { Router } = require("express");
const router = Router();
const aiController = require("../controllers/aiController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/attendance/train", upload.none(), aiController.trainAttendanceModel);
router.post("/attendance/predict", upload.none(), aiController.predictAttendance);

module.exports = router;
