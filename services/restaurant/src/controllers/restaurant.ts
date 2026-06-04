import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Restaurant from "../models/Restaurant.js";
import getBuffer from "../config/datauri.js";
import axios from "axios";
import jwt from "jsonwebtoken";

export const addRestaurant = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const existingRestaurant = await Restaurant.findOne({ ownerId: user._id });
  if (existingRestaurant) {
    return res.status(400).json({ message: "You already have a restaurant" });
  }

  const { name, description, latitude, longitude, formattedAddress, phone } = req.body;
  if (!name || !latitude || !longitude || !phone) {
    return res.status(400).json({ message: "Please provide all details" });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Please provide an image" });
  }

  const fileBuffer = getBuffer(file);
  if (!fileBuffer?.content) {
    return res.status(500).json({ message: "Failed to create file buffer" });
  }

  const { data: uploadResult } = await axios.post(
    `${process.env.UTILS_SERVICE}/api/upload`,
    { buffer: fileBuffer.content },
    { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
  );

  const restaurant = await Restaurant.create({
    name,
    description,
    phone,
    image: uploadResult.url,
    ownerId: user._id,
    autoLocation: {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
      formattedAddress,
    },
    isVerified: false,
  });

  return res.status(201).json({ message: "Restaurant created successfully", restaurant });
});

export const fetchMyRestaurant = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Please Login" });
  }

  const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
  if (!restaurant) {
    return res.status(400).json({ message: "No Restaurant Found" });
  }

  if (!req.user.restaurantId) {
    const jwtSecret = process.env.JWT_SEC;
    if (!jwtSecret) {
      return res.status(500).json({ message: "Server misconfiguration: JWT secret missing" });
    }

    const token = jwt.sign(
      {
        user: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          image: req.user.image,
          role: req.user.role,
          restaurantId: restaurant._id.toString(),
        },
      },
      jwtSecret,
      { expiresIn: "15d" }
    );
    return res.json({ restaurant, token });
  }

  res.json({ restaurant });
});

export const updateStatusRestaurant = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(403).json({ message: "Please Login" });
  }

  const { status } = req.body;
  if (typeof status !== "boolean") {
    return res.status(400).json({ message: "Status must be boolean" });
  }

  const restaurant = await Restaurant.findOneAndUpdate(
    { ownerId: req.user._id },
    { isOpen: status },
    { new: true }
  );

  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  res.json({ message: "Restaurant status updated", restaurant });
});

export const updateRestaurant = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(403).json({ message: "Please Login." });
  }

  const { name, description } = req.body;
  const restaurant = await Restaurant.findOneAndUpdate(
    { ownerId: req.user._id },
    { name, description },
    { new: true }
  );

  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  res.json({ message: "Restaurant updated", restaurant });
});

// FIX: renamed first parameter from `require` (a reserved word in CommonJS / Node)
// to `req` — using `require` as a variable name risks shadowing the global and
// will fail under certain bundler/linter configurations.
export const getNearbyRestaurant = TryCatch(async (req, res) => {
  const { latitude, longitude, radius = 5000, search = "" } = req.query;
  if (!latitude || !longitude) {
    return res.status(400).json({
      message: "Latitude and longitude are required",
    });
  }
  const query: any = { isVerified: true };
  if (search && typeof search === "string") {
    query.name = { $regex: search, $options: "i" };
  }
  const restaurants = await Restaurant.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        distanceField: "distance",
        maxDistance: Number(radius),
        spherical: true,
        query,
      },
    },
    {
      $sort: {
        isOpen: -1,
        distance: 1,
      },
    },
    {
      $addFields: {
        distanceKm: {
          $round: [{ $divide: ["$distance", 1000] }, 2],
        },
      },
    },
  ]);
  res.json({
    success: true,
    count: restaurants.length,
    restaurants,
  });
});

export const fetchSingleRestaurant = TryCatch(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  res.json(restaurant);
});