const {Router} = require("express")
const router = Router()
const requestController = require("../../controllers/User/requestController")
const requireAuth = require("../../middleware/authMiddleware")
const {uploadProfileImage} = require('../../middleware/multer')
const requireRole = require("../../middleware/roleMiddleware")
const multer = require("multer")
const storage = multer.memoryStorage()
const upload = multer({storage : storage})

router.post("/user/create-request" , requireRole("user")  , requestController.createRequest)



module.exports = router