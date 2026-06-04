import express from "express";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import authRoute from "./routes/auth.js";
import cors from "cors";
import rateLimit from "express-rate-limit";

// FIX: removed unused `logger` import from @ordersync/shared — the auth service
// uses its own console logging; importing but not using logger causes a
// TypeScript `noUnusedLocals` build error.

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});

app.use("/api/auth", authLimiter, authRoute);

const PORT = process.env.PORT || 5000;
connectDB();
app.listen(PORT, () => {
  console.log(`Auth service is running on port ${PORT}`);
});