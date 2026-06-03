import User from '../model/User.js';
import jwt from 'jsonwebtoken';
import TryCatch from '../middlewares/trycatch.js';
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { oauth2client } from "../config/googleconfig.js";
import axios from "axios";

// ─── Helper ───────────────────────────────────────────────────────────────────

const signToken = (user: { _id: any; name: string; email: string; image: string; role: string }) => {
    return jwt.sign(
        {
            user: {
                _id: user._id.toString(),
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

// ─── Controllers ─────────────────────────────────────────────────────────────

export const loginUser = TryCatch(async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Authorization code is required" });

    const googleRes = await oauth2client.getToken(code);
    oauth2client.setCredentials(googleRes.tokens);

    const userRes = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );
    const { email, name, picture } = userRes.data;

    // Use findOneAndUpdate with { upsert: true } to handle new users reliably
    let user = await User.findOneAndUpdate(
        { email },
        { 
            $setOnInsert: { name, image: picture, email } 
        },
        { upsert: true, new: true }
    );

    // Ensure user object exists before signing
    if (!user) {
        return res.status(500).json({ message: "Failed to create or retrieve user" });
    }

    const token = signToken(user);
    res.status(200).json({ message: "Login successful", token, user });
});

const ALLOWED_ROLES = ["customer", "rider", "seller"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    // FIX: Prevent role change after it has been set — prevents privilege escalation
    if (req.user.role) {
        return res.status(400).json({ message: "Role is already set and cannot be changed" });
    }

    const { role } = req.body as { role: AllowedRole };
    if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ message: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}` });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = signToken(user);
    res.json({ user, token });
});

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
    res.json(req.user);
});
