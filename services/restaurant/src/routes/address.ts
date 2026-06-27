import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import { addAddress, deleteAddress, getMyAddress } from '../controllers/address.js';

const router=express.Router();
router.post("/new", isAuth, isCustomer, addAddress);
router.delete("/:id", isAuth, isCustomer, deleteAddress);
router.get("/all", isAuth, isCustomer, getMyAddress);
export default router;