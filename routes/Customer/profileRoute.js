const {Router} = require("express")
const router = Router()
const profileController = require("../../controllers/Customer/profileController")
const requireAuth = require("../../middleware/authMiddleware")
const {uploadProfileImage} = require('../../middleware/multer')
const requireRole = require("../../middleware/roleMiddleware")
const multer = require("multer")
const storage = multer.memoryStorage()
const upload = multer({storage : storage})

router.post("/admin/edit-profile" , requireRole("customer") , uploadProfileImage.single("profileImage")  , profileController.editProfile)



module.exports = router