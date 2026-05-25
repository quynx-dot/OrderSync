import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler so you never need try/catch inside controllers.
 * Any thrown error is caught here and returned as a JSON response.
 *
 * Usage:
 *   export const myHandler = TryCatch(async (req, res) => {
 *     const data = await someAsyncThing();
 *     res.json(data);
 *   });
 *
 * Error shape:
 *   { message: string }
 *
 * You can attach a statusCode to any error you throw:
 *   const err: any = new Error("Not found");
 *   err.statusCode = 404;
 *   throw err;
 */
const TryCatch = (handler: RequestHandler): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (err: any) {
            const status  = err?.statusCode ?? 500;
            const message = err?.message    ?? "Internal Server Error";

            // Always log the full error server-side for observability.
            // Never expose stack traces to the client.
            console.error(`[TryCatch] ${req.method} ${req.path} →`, err);

            res.status(status).json({ message });
        }
    };

export default TryCatch;