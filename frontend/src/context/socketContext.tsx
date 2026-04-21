import {
    createContext,
    use,
    useContext,
    useEffect,
    useRef,
    type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppData } from './AppContext';
import { realtimeService } from '../main';
interface SocketContextType {
    socket: Socket | null;
}

const SocketContext =createContext<SocketContextType|null>(null);

export const SocketProvider=({children}:{children: ReactNode})=>{
    const {isAuth}=useAppData();
    const socketRef=useRef<Socket|null>(null);
    useEffect(()=>{
        if(!isAuth){
            socketRef.current?.disconnect();
            socketRef.current=null;
            return;
        }
        if(socketRef.current) return;
        const socket =io(realtimeService,{
            auth:{
                token:localStorage.getItem("token"),
            },
            transports:["websocket"],
        });
        socketRef.current=socket;
        socket.on("connect",()=>{
            console.log("Connected to socket server with id:",socket.id);

        })
        socket.on("disconnect",()=>{
            console.log("Disconnected from socket server");
        });
        socket.on("connect_error",(err)=>{
            console.error("Connection error:",err.message);
        });
        return ()=>{
            socket.disconnect();
            socketRef.current=null;
        }
    },[isAuth]);

        
    return (
        <SocketContext.Provider value={{ socket: socketRef.current }}>
            {children}
        </SocketContext.Provider>
    )
}
export const useSocket=()=>useContext(SocketContext);