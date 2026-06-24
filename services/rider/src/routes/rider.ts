import express from "express";
import {
    acceptOrder,
    addRiderProfile,
    fetchMyCurrentOrder,
    fetchMyProfile,
    toggleRiderAvailability,
    updateOrderStatus,
    updateRiderLocation,
    resetRiderAvailability,
} from "../controllers/rider.js";
import { isAuth, isRider } from "../middlewares/isAuth.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

// Internal middleware — inline since rider service doesn't use @ordersync/shared
const internalAuth = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
): void => {
    const secret = req.headers["x-internal-key"];
    if (!secret || secret !== process.env.INTERNAL_SERVICE_KEY) {
        res.status(403).json({ message: "Forbidden" });
        return;
    }
    next();
};

router.post("/new", isAuth, uploadFile, addRiderProfile);
router.get("/myprofile", isAuth, fetchMyProfile);
router.patch("/toggle", isAuth, toggleRiderAvailability);
router.post("/accept/:orderId", isAuth, isRider, acceptOrder);
router.get("/order/current", isAuth, isRider, fetchMyCurrentOrder);
router.put("/order/update/:orderId", isAuth, isRider, updateOrderStatus);
router.post("/location/update", isAuth, isRider, updateRiderLocation);
// Internal route — protected by internalAuth, not isAuth
router.patch("/internal/reset/:riderId", internalAuth, resetRiderAvailability);

export default router;