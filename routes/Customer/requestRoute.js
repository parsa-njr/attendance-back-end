const {Router} = require("express")
const router = Router()
const requestController = require("../../controllers/Customer/requestController")
const requireAuth = require("../../middleware/authMiddleware")
const {uploadProfileImage} = require('../../middleware/multer')
const requireRole = require("../../middleware/roleMiddleware")
const multer = require("multer")
const storage = multer.memoryStorage()
const upload = multer({storage : storage})

router.get("/customer/requests" , requireRole("customer")  , requestController.getRequests)
router.post("/customer/requests/:requestId" , requireRole("customer")  , requestController.updateRequestStatus)



module.exports = router