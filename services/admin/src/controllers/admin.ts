import { ObjectId } from "mongodb"
import TryCatch from "../middlewares/trycatch.js"
import { getRestaurantCollection, getRiderCollection } from "../util/collection.js";

export const getPendingRestaurant = TryCatch(async (req, res) => {
    const restaurants = await (await getRestaurantCollection())
        .find({ isVerified: false })   // ← capital V
        .toArray();
    res.json({ count: restaurants.length, restaurants });
});

export const getPendingRiders = TryCatch(async (req, res) => {
    const riders = await (await getRiderCollection())
        .find({ isVerified: false })   // ← already correct
        .toArray();
    res.json({ count: riders.length, riders });
});

export const verifyRestaurant = TryCatch(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== "string" || !ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Restaurant id" });
    }
    const result = await (await getRestaurantCollection()).updateOne(
        { _id: new ObjectId(id) },
        { $set: { isVerified: true, updatedAt: new Date() } }  // ← capital V
    );
    if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Restaurant Not Found" });
    }
    res.json({ message: "Restaurant Verified Successfully" });
});

export const verifyRider = TryCatch(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== "string" || !ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Rider id" });
    }
    const result = await (await getRiderCollection()).updateOne(
        { _id: new ObjectId(id) },
        { $set: { isVerified: true, updatedAt: new Date() } }  // ← capital V
    );
    if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Rider Not Found" });
    }
    res.json({ message: "Rider Verified Successfully" });
});