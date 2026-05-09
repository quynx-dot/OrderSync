import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import { assignRiderToOrder,  createOrder, fetchOrderForPayment, fetchRestaurantOrders, fetchSingleOrder, getCurrentOrderForRider, getMyOrders, updateOrderStatus, updateOrderStatusRider } from "../controllers/order.js";

const router= express.Router();

router.get("/my", isAuth, getMyOrders);
router.get("/payment/:id", fetchOrderForPayment);
router.get("/current/rider", getCurrentOrderForRider);
router.get("/restaurants/:restaurantId", isAuth, isSeller, fetchRestaurantOrders);
router.post("/new", isAuth, createOrder);
router.put("/assign/rider", assignRiderToOrder);
router.put("/update/status/rider", updateOrderStatusRider);
router.put("/:orderId", isAuth, isSeller, updateOrderStatus);
router.get("/:id", isAuth, fetchSingleOrder);




export default router;
//API KEY=rzp_test_SdLSQPZrJw32u4
//KEY SECRET=0KppjLbQKPlBUS973FvK9ZM2