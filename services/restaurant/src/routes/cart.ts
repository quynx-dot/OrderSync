import express from "express";
import { addToCart, fetchMyCart, decrementCartItem, incrementCartItem,clearCart } from "../controllers/cart.js";
import { isAuth } from "../middlewares/isAuth.js";

const router=express.Router();
router.post("/add",isAuth, addToCart);
router.get("/all", isAuth, fetchMyCart)
router.put("/inc", isAuth, incrementCartItem);
router.put("/dec", isAuth,decrementCartItem);
router.delete("/clear",isAuth, clearCart);

export default router;