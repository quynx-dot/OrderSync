import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { useAppData } from "./AppContext";
import { realtimeService } from "../main";

interface SocketContextType {
    socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const { isAuth } = useAppData();
    const [socket, setSocket] = useState<Socket | null>(null);
    // Use a ref to track whether we have an active socket to avoid
    // creating duplicate connections during React StrictMode double-invocations
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!isAuth) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        // Don't reconnect if we already have a live socket
        if (socketRef.current?.connected) return;

        const newSocket = io(realtimeService, {
            auth: { token: localStorage.getItem("token") },
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        newSocket.on("connect", () => {
            console.log("🔌 Socket connected:", newSocket.id);
        });
        newSocket.on("disconnect", (reason) => {
            console.log("🔌 Socket disconnected:", reason);
        });
        newSocket.on("connect_error", (err) => {
            console.error("🔌 Socket error:", err.message);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            socketRef.current = null;
        };
    }, [isAuth]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = (): SocketContextType => {
    const context = useContext(SocketContext);
    if (!context) throw new Error("useSocket must be used within SocketProvider");
    return context;
};
