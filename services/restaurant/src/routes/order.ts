import express from "express";
import { isAuth, isSeller, internalAuth } from "@ordersync/shared"; // Import internalAuth
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

// 1. PUBLIC/CUSTOMER ROUTES (Protected by isAuth)
router.get("/my", isAuth, getMyOrders);
router.post("/new", isAuth, createOrder);
router.get("/:id", isAuth, fetchSingleOrder);

// 2. RESTAURANT OWNER ROUTES (Protected by isAuth and isSeller)
router.get("/sales", isAuth, isSeller, getRestaurantSales);
router.get("/restaurants/:restaurantId", isAuth, isSeller, fetchRestaurantOrders);
router.put("/:orderId", isAuth, isSeller, updateOrderStatus);

// 3. INTERNAL SERVICE ROUTES (Protected by internalAuth)
// These are only called by your other microservices (e.g., Utils or Rider service)
router.get("/payment/:id", internalAuth, fetchOrderForPayment); 
router.get("/current/rider", internalAuth, getCurrentOrderForRider);
router.put("/assign/rider", internalAuth, assignRiderToOrder);
router.put("/update/status/rider", internalAuth, updateOrderStatusRider);

export default router;