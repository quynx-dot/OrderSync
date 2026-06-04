import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import express from 'express';
import cors from 'cors';
import { logger } from "@ordersync/shared"; 
import restaurantRoutes from "./routes/restaurant.js";
import itemRoutes from "./routes/menuitem.js";
import cartRoutes from "./routes/cart.js";
import addressRoutes from "./routes/address.js";
import orderRoutes from "./routes/order.js";
import { connectRabbitMQ } from './config/rabbitmq.js';
import { startPaymentConsumer } from './config/payment.consume.js';
import rateLimit from 'express-rate-limit';

if (!process.env.MONGO_URI) { console.error("FATAL: MONGO_URI missing"); process.exit(1); }
if (!process.env.JWT_SEC)   { console.error("FATAL: JWT_SEC missing");   process.exit(1); }

const app = express();
app.use(cors());
app.use(express.json());

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many order requests, please try again later." },
});

const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again shortly." },
});

const PORT = process.env.PORT || 5001;

app.use("/api/restaurants", standardLimiter, restaurantRoutes);
app.use("/api/item", standardLimiter, itemRoutes);
app.use("/api/cart", standardLimiter, cartRoutes);
app.use("/api/address", standardLimiter, addressRoutes);
app.use("/api/order/new", orderLimiter);
app.use("/api/order", standardLimiter, orderRoutes);

const startServer = async () => {
    try {
        await connectRabbitMQ();
        await startPaymentConsumer();
        
        await mongoose.connect(process.env.MONGO_URI!, {
            dbName: process.env.DB_NAME || "Zomato_Clone",
        });
        console.log("MongoDB connected");
        
        app.listen(PORT, () => {
            logger.info(`Restaurant service is running on port ${PORT}`);
        });
    } catch (err: unknown) {
        logger.error({ err }, "Failed to start service");
        process.exit(1);
    }
};

startServer();