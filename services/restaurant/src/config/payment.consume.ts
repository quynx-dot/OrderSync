import Order from '../models/Order.js';
import { getChannel } from './rabbitmq.js';
import Cart from '../models/Cart.js';

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
            const order = await Order.findOneAndUpdate(
                { _id: orderId, paymentStatus: { $ne: "paid" } },
                {
                    $set: { paymentStatus: "paid", status: "placed" },
                    $unset: { expiresAt: 1 },
                },
                { new: true }
            );
            if (!order) {
                channel.ack(msg);
                return;
            }
            await Cart.deleteMany({ userId: order.userId });
            console.log("✅Order Placed:", order._id);
            channel.ack(msg);
        } catch (error) {
            console.log("❌Payment consumer error:", error);
        }
    });
};