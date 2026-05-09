import express  from "express";
import { getPendingRestaurant, getPendingRiders, verifyRestaurant, verifyRider } from "../controllers/admin.js";
import { isAdmin, isAuth } from "../middlewares/isAuth.js";

const router= express.Router();
router.get("/admin/restaurant/pending",isAuth, isAdmin, getPendingRestaurant);
router.get("/admin/rider/pending",isAuth,isAdmin, getPendingRiders);
router.patch("/verify/rider/:id",isAuth,isAdmin,verifyRider);
router.patch("/verify/restaurant/:id",isAuth,isAdmin,verifyRestaurant);
export default router;
