import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppData } from './AppContext';
import { realtimeService } from '../main';

interface SocketContextType {
    socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const { isAuth } = useAppData();
    // Use STATE instead of REF to trigger re-renders
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!isAuth) {
            setSocket((prevSocket) => {
                prevSocket?.disconnect();
                return null;
            });
            return;
        }

        const newSocket = io(realtimeService, {
            auth: {
                token: localStorage.getItem("token"),
            },
            transports: ["websocket"],
        });

        newSocket.on("connect", () => {
            console.log("Connected to socket server with id:", newSocket.id);
        });

        newSocket.on("disconnect", () => {
            console.log("Disconnected from socket server");
        });

        newSocket.on("connect_error", (err) => {
            console.error("Connection error:", err.message);
        });

        // Set the state, forcing children to receive the active socket
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
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

  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }

  return context;
};