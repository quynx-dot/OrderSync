import rateLimit, { type Options } from "express-rate-limit";
import { type Application } from "express";

/**
 * Call this once in each service's index.ts BEFORE registering any routes.
 *
 * Why trust proxy matters:
 * Behind a load balancer or reverse proxy (nginx, AWS ALB, Render, Railway),
 * every request arrives from the proxy's IP — not the user's. Without
 * `trust proxy`, all users share one IP and hit the rate limit together.
 * Setting it to 1 tells Express to read the real client IP from the first
 * X-Forwarded-For header added by your proxy.
 *
 * Set the TRUST_PROXY_HOPS env var per environment:
 *   development  → 0  (direct connection, no proxy)
 *   staging/prod → 1  (one proxy in front, e.g. nginx or a cloud LB)
 */
export const applyTrustProxy = (app: Application): void => {
    const hops = parseInt(process.env.TRUST_PROXY_HOPS ?? "0", 10);
    app.set("trust proxy", hops);
};

const makeRateLimiter = (options: Partial<Options>) =>
    rateLimit({
        standardHeaders: true,   // sends RateLimit-* headers so clients can back off gracefully
        legacyHeaders: false,    // disable deprecated X-RateLimit-* headers
        ...options,
    });

/**
 * Strict — for auth, payment initiation, order creation.
 * 10 requests per 15 minutes per real client IP.
 * A genuine user won't need more than this; an attacker will want thousands.
 */
export const strictLimiter = makeRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many requests. Please try again in 15 minutes." },
});

/**
 * Standard — for general browsing endpoints (restaurants, menu items, cart).
 * 150 requests per 15 minutes per real client IP.
 */
export const standardLimiter = makeRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: { message: "Too many requests. Please try again shortly." },
});