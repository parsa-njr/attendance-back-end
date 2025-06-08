const {Router} = require("express")
const router = Router()
const reportController = require("../../controllers/User/reportController")
// const requireAuth = require("../../middleware/authMiddleware")
// const {uploadProfileImage} = require('../../middleware/multer')
const requireRole = require("../../middleware/roleMiddleware")
// const multer = require("multer")
// const storage = multer.memoryStorage()
// const upload = multer({storage : storage})

router.get("/user/reports/" , requireRole("user")  , reportController.getReport)



module.exports = router