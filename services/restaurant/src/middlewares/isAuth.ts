import{ Response,NextFunction} from 'express';
import {AuthenticatedRequest} from "@ordersync/shared";



export { isAuth, AuthenticatedRequest, IUser } from "@ordersync/shared";


export const isSeller=async(req:AuthenticatedRequest,res:Response,next:NextFunction):Promise<void>=>{
    if(!req.user || req.user.role!=="seller"){
        res.status(403).json({
            message:"Access denied: sellers only"
        });
        return;
    }
    
    next();
};

