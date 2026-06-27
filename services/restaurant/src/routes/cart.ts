import express from "express";
import { addToCart, fetchMyCart, decrementCartItem, incrementCartItem,clearCart } from "../controllers/cart.js";
import { isAuth, isCustomer } from "ordersync/shared";

const router=express.Router();
router.post("/add",isAuth, isCustomer, addToCart);
router.get("/all", isAuth, isCustomer, fetchMyCart)
router.put("/inc", isAuth, isCustomer, incrementCartItem);
router.put("/dec", isAuth, isCustomer, decrementCartItem);
router.delete("/clear",isAuth, isCustomer, clearCart);

export default router;