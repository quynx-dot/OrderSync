import express from "express";
import { acceptOrder, addRiderProfile, fetchMyCurrentOrder, fetchMyProfile, toggleRiderAvailability, updateOrderStatus, updateRiderLocation, resetRiderAvailability} from "../controllers/rider.js";
import { isAuth, isRider } from "../middlewares/isAuth.js";
import uploadFile from "../middlewares/multer.js";


const router=express.Router()

router.post("/new",isAuth,uploadFile, addRiderProfile)
router.get("/myprofile",isAuth,fetchMyProfile)
router.patch("/toggle",isAuth,toggleRiderAvailability)
router.post("/accept/:orderId",isAuth,acceptOrder);
router.get("/order/current",isAuth, fetchMyCurrentOrder);
router.put("/order/update/:orderId",isAuth, updateOrderStatus);
router.post("/location/update", isAuth, updateRiderLocation);
router.patch("/internal/reset/:riderId",resetRiderAvailability)
export default router;