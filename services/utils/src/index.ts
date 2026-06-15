import express from 'express';
// import dotenv from 'dotenv';
// dotenv.config();
import cloudinary from "cloudinary";
import cors from 'cors'
import uploadRoutes from './routes/cloudinary.js'
import paymentRoutes from './routes/payment.js'

import { connectRabbitMQ } from './config/rabbitmq.js';
import rateLimit from 'express-rate-limit';


connectRabbitMQ();
const app = express();
app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({limit:"50mb", extended:true}));
app.use(cors());

const paymentLimiter=rateLimit({
  windowMs:15*60*1000,
  max:10,
  standardHeaders:true,
  legacyHeaders:false,
  message:{message:"Too many payment requests, please try again later."},
});
app.use("/api/payment",paymentLimiter);

const CLOUD_NAME = process.env.CLOUD_NAME;
const CLOUD_API_KEY = process.env.CLOUD_API_KEY;
const CLOUD_SECRET_KEY = process.env.CLOUD_SECRET_KEY;

if(!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_SECRET_KEY){
  console.error("Cloudinary vars:", { CLOUD_NAME, CLOUD_API_KEY, CLOUD_SECRET_KEY: CLOUD_SECRET_KEY ? "set" : "missing" });
  throw new Error("Missing Cloudinary Environment Variables");
}
cloudinary.v2.config({
  cloud_name:CLOUD_NAME,
  api_key:CLOUD_API_KEY,
  api_secret:CLOUD_SECRET_KEY,
})

app.use("/api", uploadRoutes)
app.use("/api/payment", paymentRoutes)

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Utils service is running on port ${PORT}`);
});