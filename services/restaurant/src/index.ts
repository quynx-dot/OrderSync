import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import restaurantRoutes from "./routes/restaurant.js"
import itemRoutes from "./routes/menuitem.js"
import cartRoutes from "./routes/cart.js"
import addressRoutes from "./routes/address.js";
import orderRoutes from "./routes/order.js"
import { connectRabbitMQ } from './config/rabbitmq.js';

import cors from 'cors';
import { startPaymentConsumer } from './config/payment.consume.js';

dotenv.config();
await connectRabbitMQ();
startPaymentConsumer();

const app = express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5001;

app.use("/api/restaurants", restaurantRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);
 connectDB();
app.listen(PORT, () => {
  console.log(`Restaurant service is running on port ${PORT}`);
 
});