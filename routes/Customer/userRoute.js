const {Router} = require("express")
const router = Router()
const userController = require("../../controllers/Customer/userController")
const requireAuth = require("../../middleware/authMiddleware")
const {uploadProfileImage} = require('../../middleware/multer')
const requireRole = require("../../middleware/roleMiddleware")
const multer = require("multer")
const storage = multer.memoryStorage()
const upload = multer({storage : storage})

router.post("/customer/users" , requireRole("customer") , userController.createUser)
router.post("/customer/users/:userId" , requireRole("customer")   , userController.editUser)
router.get("/customer/users" , requireRole("customer")  , userController.getUsers)
router.delete("/customer/users/:userId" , requireRole("customer")  , userController.deleteUser)


module.exports = router