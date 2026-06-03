import { z } from "zod";

const objectId = z
    .string({ required_error: "ID is required" })
    .regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const latitude = z.coerce
    .number({ required_error: "Latitude is required" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90");

const longitude = z.coerce
    .number({ required_error: "Longitude is required" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180");

export const createOrderSchema = z.object({
    addressId: objectId,
    paymentMethod: z.enum(["razorpay", "stripe"], {
        errorMap: () => ({ message: "Payment method must be 'razorpay' or 'stripe'" }),
    }),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(["accepted", "preparing", "ready_for_rider"], {
        errorMap: () => ({ message: "Invalid order status" }),
    }),
});

// ─── Payment schemas ─────────────────────────────────────────────────────────

export const createRazorpayOrderSchema = z.object({
    orderId: objectId,
});

export const verifyRazorpaySchema = z.object({
    orderId:              objectId,
    razorpay_order_id:   z.string().min(1, "Razorpay order ID is required"),
    razorpay_payment_id: z.string().min(1, "Razorpay payment ID is required"),
    razorpay_signature:  z.string().min(1, "Razorpay signature is required"),
});

export const stripeCreateSchema = z.object({
    orderId: objectId,
});

export const stripeVerifySchema = z.object({
    sessionId: z.string().min(1, "Stripe session ID is required"),
});

// ─── Restaurant schemas ──────────────────────────────────────────────────────

export const addRestaurantSchema = z.object({
    name:             z.string().min(2, "Name must be at least 2 characters").max(100),
    phone:            z.coerce.number()
                        .int("Phone must be a whole number")
                        .min(1000000000, "Enter a valid 10-digit phone number")
                        .max(9999999999, "Enter a valid 10-digit phone number"),
    description:      z.string().max(500).optional(),
    latitude,
    longitude,
    formattedAddress: z.string().min(5, "Address is required").max(300),
});

export const updateRestaurantSchema = z.object({
    name:        z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
}).refine(
    data => data.name !== undefined || data.description !== undefined,
    { message: "Provide at least one field to update" }
);

export const updateRestaurantStatusSchema = z.object({
    status: z.boolean({ required_error: "Status must be a boolean" }),
});

// ─── Menu item schemas ───────────────────────────────────────────────────────

export const addMenuItemSchema = z.object({
    name:        z.string().min(2, "Item name is required").max(100),
    description: z.string().max(300).optional(),
    price:       z.coerce
                    .number({ required_error: "Price is required" })
                    .positive("Price must be greater than 0")
                    .max(100000, "Price seems unreasonably high"),
});

// ─── Cart schemas ─────────────────────────────────────────────────────────────

export const addToCartSchema = z.object({
    restaurantId: objectId,
    itemId:       objectId,
});

export const cartItemSchema = z.object({
    itemId: objectId,
});

// ─── Address  ─────────────────────────────────────────────────────────

export const addAddressSchema = z.object({
    mobile:           z.coerce
                        .number()
                        .int()
                        .min(1000000000, "Enter a valid 10-digit mobile number")
                        .max(9999999999, "Enter a valid 10-digit mobile number"),
    formattedAddress: z.string().min(5, "Address is required").max(300),
    latitude,
    longitude,
});


export const addRiderProfileSchema = z.object({
    phoneNumber:          z.string()
                            .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    aadharNumber:         z.string()
                            .regex(/^\d{12}$/, "Aadhar number must be exactly 12 digits"),
    drivingLicenseNumber: z.string()
                            .min(5,  "Driving license number is required")
                            .max(20, "Driving license number is too long")
                            .regex(/^[A-Z0-9-]+$/i, "Invalid license number format"),
    latitude,
    longitude,
});

export const toggleRiderSchema = z.object({
    isAvailable: z.boolean({ required_error: "isAvailable must be a boolean" }),
    latitude,
    longitude,
});

export const updateRiderLocationSchema = z.object({
    latitude,
    longitude,
    orderId: objectId,
});