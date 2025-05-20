const {Router} = require("express")
const router = Router()
const categoryController = require("../controllers/categoryController")
const requireAuth = require("../middleware/authMiddleware")
const requireRole = require("../middleware/roleMiddleware")
const multer = require("multer")
const storage = multer.memoryStorage()
const upload = multer({storage : storage})

router.post("/Admin/createCat" , requireRole("admin") , upload.none() , categoryController.createCategory)
router.get("/getAllCats" , requireAuth , categoryController.getAllCats)
router.get("/getSingleCategory/:id" , requireAuth , categoryController.getSingleCat)
router.post("/updateCategory/:id" , requireRole("admin") , upload.none() , categoryController.updateCategory)

module.exports = router