import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import { createOrder, fetchOrderForPayment, fetchRestaurantOrders, fetchSingleOrder, getMyOrders, updateOrderStatus } from "../controllers/order.js";

const router= express.Router();

router.get("/my",isAuth, getMyOrders)
router.get("/payment/:id", fetchOrderForPayment);

router.post("/new",isAuth,createOrder);
router.get("/restaurants/:restaurantId", isAuth,isSeller, fetchRestaurantOrders);
router.put("/:orderId",isAuth,isSeller,updateOrderStatus);

router.get("/:id", isAuth,fetchSingleOrder);




export default router;
//API KEY=rzp_test_SdLSQPZrJw32u4
//KEY SECRET=0KppjLbQKPlBUS973FvK9ZM2