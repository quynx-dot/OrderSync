import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { createOrder, fetchOrderForPayment } from "../controllers/order.js";

const router= express.Router();

router.post("/new",isAuth,createOrder);
router.get("/payment/:id", fetchOrderForPayment);

export default router;
//API KEY=rzp_test_SdLSQPZrJw32u4
//KEY SECRET=0KppjLbQKPlBUS973FvK9ZM2