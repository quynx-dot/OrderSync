import Order from '../models/Order.js';
import { getChannel } from './rabbitmq.js';
import Cart from '../models/Cart.js';
import axios from 'axios';

export const startPaymentConsumer = async () => {
    const channel = getChannel();
    channel.consume(process.env.PAYMENT_QUEUE!, async (msg) => {
        if (!msg) return;
        try {
            const event = JSON.parse(msg.content.toString());
            if (event.type !== "PAYMENT_SUCCESS") {
                channel.ack(msg);
                return;
            }

            const { orderId } = event.data;

            // Idempotent: only update if not already paid
            const order = await Order.findOneAndUpdate(
                { _id: orderId, paymentStatus: { $ne: "paid" } },
                {
                    $set: { paymentStatus: "paid", status: "placed" },
                    $unset: { expiresAt: 1 },
                },
                { new: true }
            );

            if (!order) {
                // Already processed — ack and move on
                channel.ack(msg);
                return;
            }

            // Clear the customer's cart
            await Cart.deleteMany({ userId: order.userId });
            console.log("✅ Order placed:", order._id);

            // Notify restaurant of new order
            await axios.post(
                `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
                {
                    event: "order:new",
                    room: `restaurant:${order.restaurantId}`,
                    payload: { orderId: order._id },
                },
                { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
            );

            // Notify the customer so their Orders page updates immediately
            await axios.post(
                `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
                {
                    event: "order:update",
                    room: `user:${order.userId}`,
                    payload: { orderId: order._id, status: order.status },
                },
                { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
            );

            channel.ack(msg);
        } catch (error) {
            console.error("❌ Payment consumer error:", error);
            // Don't ack — message will be requeued
        }
    });
};
