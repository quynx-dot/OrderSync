import { useState, useEffect } from "react";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import toast from "react-hot-toast";
import MenuItems from "../components/MenuItems";
import AddMenuItem from "../components/AddMenuItem";
import RestaurantOrders from "../components/RestaurantOrders";
import SalesDashboard from "../components/SalesDashboard";

type SellerTab = "menu" | "add-item" | "orders" | "sales";

const Restaurant = () => {
    const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<SellerTab>("orders");
    const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);

   const fetchMyRestaurant = async () => {
    try {
        const { data } = await axios.get(`${restaurantService}/api/restaurants/my`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setRestaurant(data.restaurant || null);
        if (data.token) {
            localStorage.setItem("token", data.token);
            // Remove window.location.reload() — just update state instead
            // The new token is saved; next request will use it automatically
        }
    } catch (error: any) {
        if (error.response?.status === 400) {
            setRestaurant(null);
        } else if (error.response?.status === 500) {
            console.error("Server error:", error.response?.data?.message);
            toast.error(error.response?.data?.message || "Server error. Check your environment variables.");
        } else {
            toast.error("Failed to load restaurant. Please try again.");
        }
    } finally {
        setLoading(false);
    }
};
    const fetchMenuItems = async (restaurantId: string) => {
        try {
            const { data } = await axios.get(`${restaurantService}/api/item/all/${restaurantId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setMenuItems(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { fetchMyRestaurant(); }, []);
    useEffect(() => {
        if (restaurant?._id) fetchMenuItems(restaurant._id);
    }, [restaurant]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">Loading your restaurant...</p>
            </div>
        );
    }

    if (!restaurant) {
        return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;
    }

    const TABS: { key: SellerTab; label: string }[] = [
        { key: "orders", label: "Live Orders" },
        { key: "menu", label: "Menu" },
        { key: "add-item", label: "Add Item" },
        { key: "sales", label: "Sales" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6">
            <RestaurantProfile restaurant={restaurant} onUpdate={setRestaurant} isSeller={true} />

            <div className="rounded-xl bg-white shadow-sm">
                <div className="flex border-b overflow-x-auto">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex-1 min-w-max px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                                tab === t.key
                                    ? "border-b-2 border-red-500 text-red-500"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="p-5">
                    {tab === "orders" && <RestaurantOrders restaurantId={restaurant._id} />}
                    {tab === "menu" && (
                        <MenuItems
                            items={menuItems}
                            onItemDeleted={() => fetchMenuItems(restaurant._id)}
                            isSeller={true}
                        />
                    )}
                    {tab === "add-item" && (
                        <AddMenuItem onItemAdded={() => fetchMenuItems(restaurant._id)} />
                    )}
                    {tab === "sales" && <SalesDashboard />}
                </div>
            </div>
        </div>
    );
};

export default Restaurant;
