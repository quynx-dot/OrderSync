import { Request, Response, RequestHandler, NextFunction } from "express";

const TryCatch = (handler: RequestHandler): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (err: any) {
            console.error("ERROR:", err);

            res.status(err?.statusCode || 500).json({
                message: err?.message || "Internal Server Error",
            });
        }
    };
};

export default TryCatch;