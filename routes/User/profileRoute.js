const {Router} = require("express")
const router = Router()
const profileController = require("../../controllers/User/profileController")
const requireAuth = require("../../middleware/authMiddleware")
const {uploadProfileImage} = require('../../middleware/multer')
const requireRole = require("../../middleware/roleMiddleware")
const multer = require("multer")
const storage = multer.memoryStorage()
const upload = multer({storage : storage})

router.put("/user/profile" , requireRole("user") , uploadProfileImage.single("profileImage")  , profileController.editProfile)
router.get("/user/profile" , requireRole("user")   , profileController.getProfile)



module.exports = router