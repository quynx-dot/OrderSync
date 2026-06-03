import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface IUser {
    _id: string;
    name: string;
    email: string;
    image: string;
    role: string;
    restaurantId?: string;
}

export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

// 1. Standard Auth
export const isAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) { res.status(401).json({ message: "Login required" }); return; }
        const decoded = jwt.verify(token, process.env.JWT_SEC as string) as JwtPayload;
        req.user = decoded.user as IUser;
        next();
    } catch {
        res.status(401).json({ message: "Invalid token" });
    }
};

// 2. New Internal Security Middleware
export const internalAuth = (req: Request, res: Response, next: NextFunction): void => {
    const secret = req.headers['x-internal-key'];
    if (!secret || secret !== process.env.INTERNAL_SECRET) {
        res.status(403).json({ message: "Forbidden" });
        return;
    }
    next();
};

export const requireRole = (role: IUser["role"]) => (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) { res.status(403).json({ message: "Access denied" }); return; }
    next();
};

export const isSeller = requireRole("seller");
export const isRider = requireRole("rider");
export const isAdmin = requireRole("admin");