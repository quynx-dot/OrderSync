import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import getBuffer from "../config/datauri.js";
import axios from "axios";
import { Rider } from "../model/Rider.js";

export const addRiderProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "rider") return res.status(403).json({ message: "Only riders can create a rider profile" });

    const existingProfile = await Rider.findOne({ userId: user._id });
    if (existingProfile) return res.status(400).json({ message: "Rider profile already exists" });

    const file = req.file;
    if (!file) return res.status(400).json({ message: "Profile image is required" });

    const fileBuffer = getBuffer(file);
    if (!fileBuffer?.content) return res.status(500).json({ message: "Failed to process image" });

    const { data: uploadResult } = await axios.post(
        `${process.env.UTILS_SERVICE}/api/upload`,
        { buffer: fileBuffer.content },
        { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
    );

    const { phoneNumber, aadharNumber, drivingLicenseNumber, latitude, longitude } = req.body;
    if (!phoneNumber || !aadharNumber || !drivingLicenseNumber || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const riderProfile = await Rider.create({
        userId: user._id,
        picture: uploadResult.url,
        phoneNumber,
        aadharNumber,
        drivingLicenseNumber,
        location: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
        isAvailable: false,
        isVerified: false,
    });

    return res.status(201).json({ message: "Rider profile created successfully", riderProfile });
});

export const fetchMyProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const account = await Rider.findOne({ userId: user._id });
    res.json(account);
});

export const toggleRiderAvailability = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "rider") return res.status(403).json({ message: "Only riders can update availability" });

    const { isAvailable, latitude, longitude } = req.body;
    if (typeof isAvailable !== "boolean") return res.status(400).json({ message: "isAvailable must be a boolean" });
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: "Location is required" });
    }

    const rider = await Rider.findOne({ userId: user._id });
    if (!rider) return res.status(404).json({ message: "Rider profile not found" });
    if (isAvailable && !rider.isVerified) {
        return res.status(403).json({ message: "Your profile is pending verification" });
    }

    // Don't allow going online if already on an active delivery
    if (isAvailable) {
        try {
            const { data: activeOrder } = await axios.get(
                `${process.env.RESTAURANT_SERVICE}/api/order/current/rider?riderId=${rider._id}`,
                { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
            );
            if (activeOrder) {
                return res.status(400).json({ message: "Complete your current delivery before going online again" });
            }
        } catch {
            // non-fatal
        }
    }

    rider.isAvailable = isAvailable;
    rider.location = { type: "Point", coordinates: [Number(longitude), Number(latitude)] };
    rider.lastActiveAt = new Date();
    await rider.save();

    res.json({
        message: isAvailable ? "You are now online" : "You are now offline",
        rider,
    });
});

export const acceptOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
    const riderUserId = req.user?._id;
    const { orderId } = req.params;
    if (!riderUserId) return res.status(401).json({ message: "Please login" });

    const rider = await Rider.findOne({ userId: riderUserId, isAvailable: true });
    if (!rider) return res.status(404).json({ message: "Rider not found or not available" });

    try {
        const { data } = await axios.put(
            `${process.env.RESTAURANT_SERVICE}/api/order/assign/rider`,
            {
                orderId,
                riderId: rider._id.toString(),
                riderUserId: rider.userId,
                riderName: rider.phoneNumber,
                riderPhone: rider.phoneNumber,
            },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
        );

        if (data.success) {
            await Rider.findOneAndUpdate({ userId: riderUserId }, { isAvailable: false }, { new: true });
            res.json({ message: "Order accepted" });
        }
    } catch (error: any) {
        res.status(400).json({ message: error.response?.data?.message ?? "Order already taken" });
    }
});

export const fetchMyCurrentOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
    const riderUserId = req.user?._id;
    if (!riderUserId) return res.status(401).json({ message: "Please login" });

    const rider = await Rider.findOne({ userId: riderUserId, isVerified: true });
    if (!rider) return res.status(404).json({ message: "Rider not found" });

    try {
        const { data } = await axios.get(
            `${process.env.RESTAURANT_SERVICE}/api/order/current/rider?riderId=${rider._id}`,
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
        );
        res.json({ order: data });
    } catch (error: any) {
        res.status(500).json({ message: error.response?.data?.message ?? "Internal server error" });
    }
});

export const updateOrderStatus = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Please login" });

    const rider = await Rider.findOne({ userId });
    if (!rider) return res.status(404).json({ message: "Rider not found" });

    const { orderId } = req.params;
    try {
        const { data } = await axios.put(
            `${process.env.RESTAURANT_SERVICE}/api/order/update/status/rider`,
            { orderId },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
        );
        res.json({ message: data.message });
    } catch {
        res.status(500).json({ message: "Internal server error" });
    }
});

export const updateRiderLocation = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { latitude, longitude } = req.body;
    if (!userId) return res.status(401).json({ message: "Please login" });
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: "latitude and longitude are required" });
    }

    const rider = await Rider.findOne({ userId: userId as string });
    if (!rider) return res.status(404).json({ message: "Rider not found" });

    // Update rider's stored location
    await Rider.findByIdAndUpdate(rider._id, {
        location: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
        lastActiveAt: new Date(),
    });

    let activeOrder;
    try {
        const { data } = await axios.get(
            `${process.env.RESTAURANT_SERVICE}/api/order/current/rider?riderId=${rider._id}`,
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
        );
        activeOrder = data;
    } catch {
        // No active order — location update still succeeds
        return res.json({ success: true, message: "Location updated (no active order)" });
    }

    if (!activeOrder) return res.json({ success: true, message: "Location updated (no active order)" });

    try {
        await axios.post(
            `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
            {
                event: "rider:location",
                room: `user:${activeOrder.userId}`,
                payload: { latitude, longitude },
            },
            { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
        );
    } catch {
        // Emit failure is non-fatal
    }

    res.json({ success: true });
});

// ─── Internal: reset rider availability after delivery ────────────────────────

export const resetRiderAvailability = TryCatch(async (req, res) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const { riderId } = req.params;
    await Rider.findByIdAndUpdate(riderId, { isAvailable: true });
    res.json({ success: true });
});
