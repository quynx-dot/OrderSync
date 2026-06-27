import express from "express";
import { createRazorpayOrder, payWithStripe, verifyRazorpayPayment, verifyStripe } from "../controllers/payment.js";
import { isAuth } from "@ordersync/shared"
const router=express.Router();
router.post("/create", isAuth, createRazorpayOrder);
router.post("/verify", isAuth, verifyRazorpayPayment);
router.post("/stripe/create", isAuth, payWithStripe);
router.post("/stripe/verify", isAuth, verifyStripe);
export default router;