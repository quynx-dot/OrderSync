import { useEffect, useState } from "react";
import axios from "axios";
import { restaurantService } from "../main";
import { BiTrendingUp, BiPackage, BiMoney } from "react-icons/bi";

interface SalesData {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    statusBreakdown: { _id: string; count: number }[];
    recentOrders: {
        _id: string;
        status: string;
        totalAmount: number;
        items: { name: string; quantity: number }[];
        createdAt: string;
    }[];
}

const STATUS_LABELS: Record<string, string> = {
    placed: "Placed",
    accepted: "Accepted",
    preparing: "Preparing",
    ready_for_rider: "Ready for Rider",
    rider_assigned: "Rider Assigned",
    picked_up: "Picked Up",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
    placed: "bg-yellow-100 text-yellow-700",
    accepted: "bg-orange-100 text-orange-700",
    preparing: "bg-blue-100 text-blue-700",
    ready_for_rider: "bg-indigo-100 text-indigo-700",
    rider_assigned: "bg-purple-100 text-purple-700",
    picked_up: "bg-pink-100 text-pink-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
};

const SalesDashboard = () => {
    const [data, setData] = useState<SalesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const { data: res } = await axios.get(`${restaurantService}/api/order/sales`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setData(res);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchSales();
    }, []);

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center text-gray-400 text-sm">
                Loading sales data...
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex h-40 items-center justify-center text-red-400 text-sm">
                Failed to load sales data.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICard
                    icon={<BiMoney className="h-6 w-6 text-green-500" />}
                    label="Total Revenue"
                    value={`₹${data.totalRevenue.toLocaleString("en-IN")}`}
                    bg="bg-green-50"
                />
                <KPICard
                    icon={<BiPackage className="h-6 w-6 text-blue-500" />}
                    label="Total Orders"
                    value={String(data.totalOrders)}
                    bg="bg-blue-50"
                />
                <KPICard
                    icon={<BiTrendingUp className="h-6 w-6 text-purple-500" />}
                    label="Avg Order Value"
                    value={`₹${data.avgOrderValue}`}
                    bg="bg-purple-50"
                />
            </div>

            {/* Status Breakdown */}
            <div className="rounded-xl border bg-white p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Orders by Status</h3>
                {data.statusBreakdown.length === 0 ? (
                    <p className="text-sm text-gray-400">No data yet.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {data.statusBreakdown.map(({ _id, count }) => (
                            <span
                                key={_id}
                                className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[_id] ?? "bg-gray-100 text-gray-600"}`}
                            >
                                {STATUS_LABELS[_id] ?? _id}: {count}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Orders */}
            <div className="rounded-xl border bg-white p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Recent Completed Orders</h3>
                {data.recentOrders.length === 0 ? (
                    <p className="text-sm text-gray-400">No completed orders yet.</p>
                ) : (
                    <div className="space-y-3">
                        {data.recentOrders.map((order) => (
                            <div
                                key={order._id}
                                className="flex items-center justify-between rounded-lg border p-3 text-sm"
                            >
                                <div className="space-y-0.5">
                                    <p className="font-medium text-gray-800">
                                        Order #{order._id.slice(-6)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(order.createdAt).toLocaleString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="font-semibold text-gray-800">₹{order.totalAmount}</span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}
                                    >
                                        {STATUS_LABELS[order.status] ?? order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const KPICard = ({
    icon,
    label,
    value,
    bg,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    bg: string;
}) => (
    <div className={`rounded-xl ${bg} p-4 flex items-center gap-4`}>
        <div className="rounded-full bg-white p-2 shadow-sm">{icon}</div>
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

export default SalesDashboard;
