import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Canonical user shape embedded in every JWT.
 * All services share this — if you add a field here, add it to signToken()
 * in the auth service at the same time.
 */
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

/**
 * Verifies the Bearer token and attaches req.user.
 * Returns 401 on any failure — never throws.
 */
export const isAuth = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({ message: "No auth header — please log in." });
            return;
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Token missing — please log in." });
            return;
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SEC as string
        ) as JwtPayload;

        if (!decoded?.user) {
            res.status(401).json({ message: "Invalid token — please log in." });
            return;
        }

        req.user = decoded.user as IUser;
        next();
    } catch {
        // catches TokenExpiredError, JsonWebTokenError, etc.
        res.status(401).json({ message: "Token invalid or expired — please log in." });
    }
};

/**
 * Role guard factory — creates a middleware that allows only a specific role.
 *
 * Usage:
 *   router.post("/new", isAuth, requireRole("seller"), handler)
 *   router.post("/accept", isAuth, requireRole("rider"), handler)
 *
 * Why a factory instead of separate isSeller/isRider functions?
 * Single place to change role-check logic. Adding a new role = zero new middleware.
 */
export const requireRole = (role: IUser["role"]) => (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user || req.user.role !== role) {
        res.status(403).json({
            message: `Access denied: ${role}s only.`,
        });
        return;
    }
    next();
};

export const isSeller = requireRole("seller");
export const isRider  = requireRole("rider");
export const isAdmin  = requireRole("admin");