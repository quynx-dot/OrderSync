import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many payment requests, please try again later." },
});
app.use("/api/payment", paymentLimiter);

const start = async () => {
  const CLOUD_NAME = process.env.CLOUD_NAME;
  const CLOUD_API_KEY = process.env.CLOUD_API_KEY;
  const CLOUD_SECRET_KEY = process.env.CLOUD_SECRET_KEY;

  if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_SECRET_KEY) {
    throw new Error("Missing Cloudinary Environment Variables");
  }

  const cloudinary = await import('cloudinary');
  cloudinary.v2.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_SECRET_KEY,
  });

  const { connectRabbitMQ } = await import('./config/rabbitmq.js');
  await connectRabbitMQ();

  const { default: uploadRoutes } = await import('./routes/cloudinary.js');
  const { default: paymentRoutes } = await import('./routes/payment.js');

  app.use("/api", uploadRoutes);
  app.use("/api/payment", paymentRoutes);

  const PORT = process.env.PORT || 5002;
  app.listen(PORT, () => {
    console.log(`Utils service is running on port ${PORT}`);
  });
};

start().catch(err => {
  console.error("Failed to start:", err);
  process.exit(1);
});