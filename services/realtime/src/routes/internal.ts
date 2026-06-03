import express from 'express';
import {internalAuth} from "@ordersync/shared";
import {getIO} from '../socket.js'

const router=express.Router()
router.post("/emit",internalAuth,(req,res)=>{
    const {event, room, payload}=req.body;
    if(!event || !room){
        return res.status(400).json({
            message:"event and room are required",    
        });
    }
    const io=getIO()
    console.log(`Emitting event ${event} to room ${room}`);
    io.to(room).emit(event, payload ?? {})
    return res.json({success: true});
});

export default router;
