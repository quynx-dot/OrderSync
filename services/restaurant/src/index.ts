import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB, logger } from "@ordersync/shared"; 
import restaurantRoutes from "./routes/restaurant.js";
import itemRoutes from "./routes/menuitem.js";
import cartRoutes from "./routes/cart.js";
import addressRoutes from "./routes/address.js";
import orderRoutes from "./routes/order.js";
import { connectRabbitMQ } from './config/rabbitmq.js';
import { startPaymentConsumer } from './config/payment.consume.js';
import rateLimit from 'express-rate-limit';

dotenv.config();

await connectRabbitMQ();
await startPaymentConsumer();

const app = express();
app.use(cors());
app.use(express.json());

// Fixed spelling mistakes in error messages
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

// Routes
app.use("/api/restaurants", standardLimiter, restaurantRoutes);
app.use("/api/item", standardLimiter, itemRoutes);
app.use("/api/cart", standardLimiter, cartRoutes);
app.use("/api/address", standardLimiter, addressRoutes);
app.use("/api/order/new", orderLimiter);
app.use("/api/order", standardLimiter, orderRoutes);

const startServer = async () => {
    try {
        await connectDB(process.env.MONGO_URI!, process.env.DB_NAME!);
        app.listen(PORT, () => {
            logger.info(`Restaurant service is running on port ${PORT}`);
        });
    } catch (err: unknown) {
        // Fixed the logger overload error
        logger.error({ err }, "Failed to start service");
        process.exit(1);
    }
};

startServer();