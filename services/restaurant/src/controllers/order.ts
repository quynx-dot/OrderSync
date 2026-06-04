import axios from "axios";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import { IMenuItem } from "../models/MenuItems.js";
import Order from "../models/Order.js";
import Restaurant, { IRestaurant } from "../models/Restaurant.js";
import { publishEvent } from "../config/order.publisher.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
};

const emitToRealtime = async (event: string, room: string, payload: object) => {
    await axios.post(
        `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
        { event, room, payload },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
    );
};

// ─── Controllers ─────────────────────────────────────────────────────────────

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { paymentMethod, addressId } = req.body;
    if (!addressId) return res.status(400).json({ message: "Address is required" });
    if (!["razorpay", "stripe"].includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method" });
    }

    const address = await Address.findOne({ _id: addressId, userId: user._id });
    if (!address) return res.status(404).json({ message: "Address not found" });

    const cartItems = await Cart.find({ userId: user._id })
        .populate<{ itemId: IMenuItem }>("itemId")
        .populate<{ restaurantId: IRestaurant }>("restaurantId");

    if (cartItems.length === 0) return res.status(400).json({ message: "Cart is empty" });

    const firstCartItem = cartItems[0];
    if (!firstCartItem?.restaurantId) {
        return res.status(400).json({ message: "Invalid cart data" });
    }

    const restaurantId = firstCartItem.restaurantId._id;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (!restaurant.isOpen) return res.status(400).json({ message: "This restaurant is currently closed" });

    const distance = getDistanceKm(
        address.location.coordinates[1],
        address.location.coordinates[0],
        restaurant.autoLocation.coordinates[1],
        restaurant.autoLocation.coordinates[0],
    );

    let subtotal = 0;
    const orderItems = cartItems.map((cart) => {
        const item = cart.itemId;
        if (!item) throw new Error("Invalid cart item");
        subtotal += item.price * cart.quantity;
        return { itemId: item._id.toString(), name: item.name, price: item.price, quantity: cart.quantity };
    });

    const deliveryFee = subtotal < 250 ? 49 : 0;
    const platformFee = 7;
    const totalAmount = subtotal + deliveryFee + platformFee;
    const riderAmount = Math.ceil(distance) * 17;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const [longitude, latitude] = address.location.coordinates;

    const order = await Order.create({
        userId: user._id.toString(),
        restaurantId: restaurantId.toString(),
        restaurantName: restaurant.name,
        distance,
        riderAmount,
        riderId: null,
        items: orderItems,
        subtotal,
        deliveryFee,
        platformFee,
        totalAmount,
        addressId: address._id.toString(),
        deliveryAddress: {
            formattedAddress: address.formattedAddress,
            mobile: address.mobile,
            latitude,
            longitude,
        },
        paymentMethod,
        paymentStatus: "pending",
        status: "placed",
        expiresAt,
    });

    res.json({ message: "Order created successfully", orderId: order._id.toString(), amount: totalAmount });
});

// Route is already protected by internalAuth middleware — no manual header check needed.
export const fetchOrderForPayment = TryCatch(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentStatus !== "pending") return res.status(400).json({ message: "Order already paid" });
    res.json({ orderId: order._id, amount: order.totalAmount, currency: "INR" });
});

export const fetchRestaurantOrders = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    const { restaurantId } = req.params;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID is required" });

    const limit = req.query.limit ? Number(req.query.limit) : 0;
    const orders = await Order.find({ restaurantId, paymentStatus: "paid" })
        .sort({ createdAt: -1 })
        .limit(limit);

    return res.json({ success: true, count: orders.length, orders });
});

const ALLOWED_STATUSES = ["accepted", "preparing", "ready_for_rider"] as const;

export const updateOrderStatus = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    const { orderId } = req.params;
    const { status } = req.body;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentStatus !== "paid") return res.status(400).json({ message: "Order not yet paid" });

    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (restaurant.ownerId !== user._id.toString()) {
        return res.status(403).json({ message: "Not authorised to update this order" });
    }

    order.status = status;
    await order.save();

    await emitToRealtime("order:update", `user:${order.userId}`, {
        orderId: order._id,
        status: order.status,
    });

    if (status === "ready_for_rider") {
        await publishEvent("ORDER_READY_FOR_RIDER", {
            orderId: order._id.toString(),
            restaurantId: restaurant._id.toString(),
            location: restaurant.autoLocation,
        });
    }

    res.json({ message: "Order status updated", order });
});

export const getMyOrders = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const orders = await Order.find({
        userId: req.user._id.toString(),
        paymentStatus: "paid",
    }).sort({ createdAt: -1 });

    res.json({ orders });
});

export const fetchSingleOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorised to view this order" });
    }
    res.json(order);
});

// Route already protected by internalAuth middleware.
export const assignRiderToOrder = TryCatch(async (req, res) => {
    const { orderId, riderId, riderUserId, riderName, riderPhone } = req.body;

    const activeOrder = await Order.findOne({
        riderId,
        status: { $in: ["rider_assigned", "picked_up"] },
    });
    if (activeOrder) {
        return res.status(400).json({ message: "Rider already has an active order" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.riderId != null) return res.status(400).json({ message: "Order already taken" });

    const orderUpdated = await Order.findOneAndUpdate(
        { _id: orderId, riderId: null },
        { riderId, riderName, riderPhone, status: "rider_assigned" },
        { new: true }
    );

    if (!orderUpdated) {
        return res.status(400).json({ message: "Order was just taken by another rider" });
    }

    await emitToRealtime("order:rider_assigned", `user:${order.userId}`, { order: orderUpdated });
    await emitToRealtime("order:rider_assigned", `restaurant:${order.restaurantId}`, { order: orderUpdated });

    res.json({ message: "Rider assigned successfully", success: true, order: orderUpdated });
});

// Route already protected by internalAuth middleware.
export const getCurrentOrderForRider = TryCatch(async (req, res) => {
    const { riderId } = req.query;
    if (!riderId) return res.status(400).json({ message: "Rider ID is required" });

    const order = await Order.findOne({
        riderId,
        status: { $in: ["rider_assigned", "picked_up"] },
    });
    res.json(order ?? null);
});

// Route already protected by internalAuth middleware.
export const updateOrderStatusRider = TryCatch(async (req, res) => {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "rider_assigned") {
        order.status = "picked_up";
        await order.save();
        await emitToRealtime("order:update", `restaurant:${order.restaurantId}`, order);
        await emitToRealtime("order:update", `user:${order.userId}`, { order });
        return res.json({ message: "Order picked up — heading to customer" });
    }

    if (order.status === "picked_up") {
        order.status = "delivered";
        await order.save();
        await emitToRealtime("order:update", `restaurant:${order.restaurantId}`, order);
        await emitToRealtime("order:update", `user:${order.userId}`, { order });

        try {
            await axios.patch(
                `${process.env.RIDER_SERVICE}/api/rider/internal/reset/${order.riderId}`,
                {},
                { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
            );
        } catch {
            console.warn("Could not reset rider availability after delivery");
        }

        return res.json({ message: "Order delivered successfully" });
    }

    return res.status(400).json({ message: "Order status cannot be updated from its current state" });
});

export const getRestaurantSales = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const restaurantId = restaurant._id.toString();

    const [summary] = await Order.aggregate([
        { $match: { restaurantId, paymentStatus: "paid" } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                totalOrders: { $sum: 1 },
                avgOrderValue: { $avg: "$totalAmount" },
            },
        },
    ]);

    const statusBreakdown = await Order.aggregate([
        { $match: { restaurantId, paymentStatus: "paid" } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const recentOrders = await Order.find({ restaurantId, paymentStatus: "paid" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("_id status totalAmount items createdAt");

    res.json({
        totalRevenue: summary?.totalRevenue ?? 0,
        totalOrders: summary?.totalOrders ?? 0,
        avgOrderValue: summary?.avgOrderValue ? +summary.avgOrderValue.toFixed(2) : 0,
        statusBreakdown,
        recentOrders,
    });
});