import User from '../model/User.js';
import jwt from 'jsonwebtoken';
import TryCatch from '../middlewares/trycatch.js';
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { oauth2client } from "../config/googleconfig.js";
import axios from "axios";

// ✅ Helper: sign only the fields we actually need — not the full Mongoose document
// (avoids leaking __v, createdAt, etc. and keeps the JWT payload clean)
const signToken = (user: { _id: any; name: string; email: string; image: string; role: string }) => {
  return jwt.sign(
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
    },
    process.env.JWT_SEC as string,
    { expiresIn: "15d" }
  );
};

export const loginUser = TryCatch(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Authorization code is required" });
  }

  const googleRes = await oauth2client.getToken(code);
  oauth2client.setCredentials(googleRes.tokens);

  const userRes = await axios.get(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
  );
  const { email, name, picture } = userRes.data;

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, image: picture });
  }

  const token = signToken(user);
  res.status(200).json({ message: "Logged Success", token, user });
});

const allowedRoles = ["customer", "rider", "seller"] as const;
type Role = (typeof allowedRoles)[number];

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { role } = req.body as { role: Role };
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findByIdAndUpdate(req.user._id, { role }, { new: true });
  if (!user) {
    return res.status(404).json({ message: "User Not Found" });
  }

  const token = signToken(user);
  res.json({ user, token });
});

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  res.json(user);
});