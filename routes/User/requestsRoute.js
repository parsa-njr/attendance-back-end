const {Router} = require("express")
const router = Router()
const requestController = require("../../controllers/User/requestController")
const requireAuth = require("../../middleware/authMiddleware")
const {uploadProfileImage} = require('../../middleware/multer')
const requireRole = require("../../middleware/roleMiddleware")
const multer = require("multer")
const storage = multer.memoryStorage()
const upload = multer({storage : storage})

router.post("/user/requests" , requireRole("user")  , requestController.createRequest)
router.get("/user/requests" , requireRole("user")  , requestController.getRequest)


module.exports = router