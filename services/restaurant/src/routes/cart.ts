import express from "express";
import { addToCart, fetchMyCart, decrementCartItem, incrementCartItem,clearCart } from "../controllers/cart.js";
import { isAuth,validate,addToCartSchema  } from "@ordersync/shared";

const router=express.Router();
router.post("/add",isAuth,validate(addToCartSchema), addToCart);
router.get("/all", isAuth, fetchMyCart)
router.put("/inc", isAuth, incrementCartItem);
router.put("/dec", isAuth,  decrementCartItem);
router.delete("/clear",isAuth, clearCart);

export default router;