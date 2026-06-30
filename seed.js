
import mongoose from "mongoose";

const MONGO_URI = process.argv[2];
const DB_NAME = "OrderSync";

if (!MONGO_URI) {
    console.error("❌ Please provide MONGO_URI as argument");
    console.error("Usage: node seed.js \"mongodb+srv://...\"");
    process.exit(1);
}


const RestaurantSchema = new mongoose.Schema({
    name: String,
    description: String,
    image: String,
    ownerId: String,
    phone: Number,
    isVerified: Boolean,
    autoLocation: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: [Number],
        formattedAddress: String,
    },
    isOpen: Boolean,
}, { timestamps: true });
RestaurantSchema.index({ autoLocation: "2dsphere" });

const MenuItemSchema = new mongoose.Schema({
    restaurantId: mongoose.Schema.Types.ObjectId,
    name: String,
    description: String,
    price: Number,
    image: String,
    isAvailable: Boolean,
}, { timestamps: true });

const Restaurant = mongoose.model("Restaurant", RestaurantSchema);
const MenuItem = mongoose.model("MenuItem", MenuItemSchema);

// ─── Data ─────────────────────────────────────────────────────────────────────

const SEED_OWNER_IDS = [
    "64a7f3b2c9e1d82f4a0b5c11",
    "64a7f3b2c9e1d82f4a0b5c22",
    "64a7f3b2c9e1d82f4a0b5c33",
    "64a7f3b2c9e1d82f4a0b5c44",
    "64a7f3b2c9e1d82f4a0b5c55",
];

const restaurants = [
    {
        name: "Aahar Express",
        description: "Authentic North Indian cuisine — rich gravies, tandoor breads, and classic curries.",
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
        ownerId: SEED_OWNER_IDS[0],
        phone: 9876543210,
        isVerified: true,
        isOpen: true,
        autoLocation: {
            type: "Point",
            coordinates: [73.8567, 18.5204], // Pune city center
            formattedAddress: "FC Road, Shivajinagar, Pune, Maharashtra 411005",
        },
        menuItems: [
            { name: "Butter Chicken", description: "Creamy tomato-based chicken curry", price: 320, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400" },
            { name: "Paneer Tikka", description: "Tandoor-grilled cottage cheese with peppers", price: 280, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400" },
            { name: "Dal Makhani", description: "Slow-cooked black lentils with butter and cream", price: 220, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400" },
            { name: "Garlic Naan", description: "Soft leavened bread with garlic and butter", price: 60, image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400" },
            { name: "Veg Biryani", description: "Fragrant basmati rice with mixed vegetables and spices", price: 260, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400" },
            { name: "Lassi", description: "Chilled yogurt drink — sweet or salted", price: 80, image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400" },
        ],
    },
    {
        name: "Wok & Roll",
        description: "Indo-Chinese street food and wok-tossed noodles done right.",
        image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800",
        ownerId: SEED_OWNER_IDS[1],
        phone: 9812345678,
        isVerified: true,
        isOpen: true,
        autoLocation: {
            type: "Point",
            coordinates: [73.8777, 18.5314], // Koregaon Park
            formattedAddress: "North Main Road, Koregaon Park, Pune, Maharashtra 411001",
        },
        menuItems: [
            { name: "Chicken Hakka Noodles", description: "Wok-tossed noodles with vegetables and chicken", price: 240, image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400" },
            { name: "Veg Manchurian", description: "Crispy vegetable dumplings in spicy Manchurian sauce", price: 200, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400" },
            { name: "Fried Rice", description: "Wok-tossed rice with egg and vegetables", price: 180, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400" },
            { name: "Spring Rolls", description: "Crispy rolls stuffed with cabbage and noodles", price: 160, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400" },
            { name: "Chilli Chicken", description: "Crispy chicken tossed in spicy chilli sauce", price: 280, image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400" },
            { name: "Hot and Sour Soup", description: "Tangy spicy soup with mushrooms and tofu", price: 140, image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400" },
        ],
    },
    {
        name: "Brew Stop",
        description: "All-day breakfast, sandwiches, and specialty coffee in a cozy setting.",
        image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
        ownerId: SEED_OWNER_IDS[2],
        phone: 9823456789,
        isVerified: true,
        isOpen: true,
        autoLocation: {
            type: "Point",
            coordinates: [73.8674, 18.5089], // Deccan
            formattedAddress: "Deccan Gymkhana, Pune, Maharashtra 411004",
        },
        menuItems: [
            { name: "Avocado Toast", description: "Sourdough toast with smashed avocado and poached egg", price: 220, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400" },
            { name: "Cappuccino", description: "Double shot espresso with steamed milk foam", price: 120, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400" },
            { name: "Club Sandwich", description: "Triple-layered sandwich with chicken, egg, and veggies", price: 260, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400" },
            { name: "Pancakes", description: "Fluffy buttermilk pancakes with maple syrup", price: 180, image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400" },
            { name: "Caesar Salad", description: "Romaine lettuce with Caesar dressing and croutons", price: 200, image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400" },
            { name: "Cold Coffee", description: "Chilled blended coffee with milk and ice cream", price: 140, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400" },
        ],
    },
    {
        name: "Dosa Republic",
        description: "Crispy South Indian dosas, idlis, and filter coffee since 1985.",
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800",
        ownerId: SEED_OWNER_IDS[3],
        phone: 9834567890,
        isVerified: true,
        isOpen: false, // intentionally closed for demo variety
        autoLocation: {
            type: "Point",
            coordinates: [73.8553, 18.5167], // Sadashiv Peth
            formattedAddress: "Sadashiv Peth, Pune, Maharashtra 411030",
        },
        menuItems: [
            { name: "Masala Dosa", description: "Crispy rice crepe with spiced potato filling", price: 120, image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400" },
            { name: "Idli Sambar", description: "Steamed rice cakes with lentil soup and chutneys", price: 90, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400" },
            { name: "Uttapam", description: "Thick rice pancake topped with onion and tomato", price: 110, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400" },
            { name: "Filter Coffee", description: "Traditional South Indian drip coffee with milk", price: 60, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400" },
            { name: "Medu Vada", description: "Crispy lentil doughnut served with sambar and chutney", price: 80, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400" },
        ],
    },
    {
        name: "Smash Theory",
        description: "Smash burgers, loaded fries, and thick shakes. No salads, no apologies.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
        ownerId: SEED_OWNER_IDS[4],
        phone: 9845678901,
        isVerified: true,
        isOpen: true,
        autoLocation: {
            type: "Point",
            coordinates: [73.9089, 18.5590], // Viman Nagar
            formattedAddress: "Viman Nagar, Pune, Maharashtra 411014",
        },
        menuItems: [
            { name: "Classic Smash Burger", description: "Double smash patty with cheese, pickles, and special sauce", price: 280, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
            { name: "Crispy Chicken Burger", description: "Fried chicken fillet with coleslaw and mayo", price: 260, image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400" },
            { name: "Loaded Fries", description: "Fries topped with cheese sauce, jalapeños, and bacon bits", price: 180, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },
            { name: "Chocolate Shake", description: "Thick blended chocolate milkshake with whipped cream", price: 160, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400" },
            { name: "Veg Burger", description: "Crispy veggie patty with lettuce, tomato, and cheese", price: 220, image: "https://images.unsplash.com/photo-1550317138-10000687a72b?w=400" },
            { name: "Onion Rings", description: "Crispy battered onion rings with dipping sauce", price: 120, image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400" },
        ],
    },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
        console.log("✅ Connected to MongoDB");

        // Clear existing seeded data only (don't touch real user data)
        await Restaurant.deleteMany({ ownerId: { $in: SEED_OWNER_IDS } });
        console.log("🗑️  Cleared old seed data");

        for (const r of restaurants) {
            const { menuItems, ...restaurantData } = r;

            const restaurant = await Restaurant.create(restaurantData);
            console.log(`🍽️  Created restaurant: ${restaurant.name}`);

            const items = menuItems.map(item => ({
                ...item,
                restaurantId: restaurant._id,
                isAvailable: true,
            }));

            await MenuItem.insertMany(items);
            console.log(`   ✅ Added ${items.length} menu items`);
        }

        console.log("\n🎉 Seeding complete!");
        console.log(`   ${restaurants.length} restaurants created`);
        console.log(`   ${restaurants.reduce((acc, r) => acc + r.menuItems.length, 0)} menu items created`);
        console.log("\nAll restaurants are verified and open (except Dosa Republic — closed for variety)");

    } catch (err) {
        console.error("❌ Seed failed:", err);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
}

seed();