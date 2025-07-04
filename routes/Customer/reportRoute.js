const {Router} = require("express")
const router = Router()
const reportController = require("../../controllers/Customer/reportController")
const requireRole = require("../../middleware/roleMiddleware")


router.get("/customer/get-location-users/:locationId" , requireRole("customer")  , reportController.getUsersBaseLocation)
router.get("/customer/get-user-base-report/" , requireRole("customer")  , reportController.getUserBaseReport)
router.get("/customer/get-date-base-report/" , requireRole("customer")  , reportController.getDateBaseLocation)



module.exports = router