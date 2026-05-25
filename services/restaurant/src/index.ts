import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
import restaurantRoutes from "./routes/restaurant.js"
import itemRoutes from "./routes/menuitem.js"
import cartRoutes from "./routes/cart.js"
import addressRoutes from "./routes/address.js";
import orderRoutes from "./routes/order.js"
import { connectRabbitMQ } from './config/rabbitmq.js';

import cors from 'cors';
import { startPaymentConsumer } from './config/payment.consume.js';
import rateLimit from 'express-rate-limit';


await connectRabbitMQ();
startPaymentConsumer();

const app = express();
app.use(cors());
app.use(express.json());

const orderLimiter=rateLimit({
  windowMs:15*60*1000,
  max:10,
  standardHeaders:true,
  legacyHeaders:false,
  message:{message:"Too many order requests, please try again later."},
});

const standardLimiter=rateLimit({
  windowMs:15*60*1000,
  max:100,
  standardHeaders:true,
  legacyHeaders:false,
  message:{messsage:"Too many requests, please try again later. "},
});


const PORT = process.env.PORT || 5001;

app.use("/api/restaurants", standardLimiter, restaurantRoutes);
app.use("/api/item", standardLimiter, itemRoutes);
app.use("/api/cart",standardLimiter, cartRoutes);
app.use("/api/address",standardLimiter, addressRoutes);
app.use("/api/order/new", orderLimiter);
app.use("/api/order", standardLimiter, orderRoutes);
 connectDB();
app.listen(PORT, () => {
  console.log(`Restaurant service is running on port ${PORT}`);
 
});