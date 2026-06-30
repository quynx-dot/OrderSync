import express from 'express';
import { isAuth, validate, addAddressSchema } from "@ordersync/shared";import { addAddress, deleteAddress, getMyAddress } from '../controllers/address.js';

const router=express.Router();
router.post("/new", isAuth, validate(addAddressSchema), addAddress);
router.delete("/:id", isAuth, deleteAddress);
router.get("/all", isAuth,getMyAddress);
export default router;