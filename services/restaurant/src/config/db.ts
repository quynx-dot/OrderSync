// services/restaurant/src/config/db.ts
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        console.log("Starting connection to MongoDB...");
        const conn = await mongoose.connect(process.env.MONGO_URI as string, {
            dbName: process.env.DB_NAME || "Zomato_Clone",
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s to debug faster
        });
        
        console.log(`Connected to Host: ${conn.connection.host}`);
        
        // This will throw if the connection is truly broken
        const collections = await mongoose.connection.db?.listCollections().toArray();
        console.log("Database Collections:", collections?.map(c => c.name));
        
    } catch (error) {
        console.error("CRITICAL CONNECTION ERROR:", error);
    }
};

export default connectDB;