import express from "express";
import { isAuth, isSeller, internalAuth } from "@ordersync/shared";
import {
    assignRiderToOrder,
    createOrder,
    fetchOrderForPayment,
    fetchRestaurantOrders,
    fetchSingleOrder,
    getCurrentOrderForRider,
    getMyOrders,
    getRestaurantSales,
    updateOrderStatus,
    updateOrderStatusRider,
} from "../controllers/order.js";

const router = express.Router();

// 1. CUSTOMER ROUTES
router.get("/my", isAuth, getMyOrders);
router.post("/new", isAuth, createOrder);

// 2. RESTAURANT OWNER ROUTES
router.get("/sales", isAuth, isSeller, getRestaurantSales);
router.get("/restaurants/:restaurantId", isAuth, isSeller, fetchRestaurantOrders);

// 3. INTERNAL SERVICE ROUTES — must come BEFORE "/:orderId" so Express
//    doesn't treat "assign" or "update" as an orderId parameter.
router.get("/payment/:id", internalAuth, fetchOrderForPayment);
router.get("/current/rider", internalAuth, getCurrentOrderForRider);
router.put("/assign/rider", internalAuth, assignRiderToOrder);
router.put("/update/status/rider", internalAuth, updateOrderStatusRider);

// 4. PARAMETERIZED ROUTES — must be LAST
router.get("/:id", isAuth, fetchSingleOrder);
router.put("/:orderId", isAuth, isSeller, updateOrderStatus);

export default router;