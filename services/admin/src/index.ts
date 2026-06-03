import express from 'express'
import dotenv from 'dotenv'
import adminRoutes from "./routes/admin.js"
import cors from "cors"
import { connectDb } from "./config/db.js"

dotenv.config()

const app = express();

app.use(cors());
// FIX: express.json() was missing — all PATCH request bodies were undefined
app.use(express.json());

app.use("/api/v1", adminRoutes);

app.listen(process.env.PORT, async () => {
    console.log(`Admin Service is running on port ${process.env.PORT}`);
    await connectDb();
});
