const {Router} = require("express")
const router = Router()
const userController = require("../../controllers/Customer/userController")
const requireAuth = require("../../middleware/authMiddleware")
const {uploadProfileImage} = require('../../middleware/multer')
const requireRole = require("../../middleware/roleMiddleware")
const multer = require("multer")
const storage = multer.memoryStorage()
const upload = multer({storage : storage})

router.post("/admin/create-user" , requireRole("customer") , uploadProfileImage.single("profileImage")  , userController.createUser)
router.post("/admin/edit-user/:userId" , requireRole("customer") , uploadProfileImage.single("profileImage")  , userController.editUser)
router.get("/admin/get-users" , requireRole("customer")  , userController.getUsers)
router.delete("/admin/delete-user/:userId" , requireRole("customer")  , userController.deleteUser)


module.exports = router