import { createContext, type ReactNode, useState, useEffect, useContext } from "react";
import axios from "axios";
import { authService } from "../main";
import { type LocationData, type AppContextType, type User } from "../types";
import { Toaster } from "react-hot-toast";


const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [city, setCity] = useState("Fetching Location ...");

  async function fetchuser() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return; // no token, skip the request entirely
      const { data } = await axios.get(`${authService}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(data);
      setIsAuth(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchuser();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setCity("Location unavailable");
      return;
    }
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      // ✅ success callback
      async (position) => {
        const { longitude, latitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          setLocation({
            latitude,
            longitude,
            formattedAddress: data.display_name || "Current location",
          });
          setCity(
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "Your location"
          );
        } catch (error) {
          setLocation({ latitude, longitude, formattedAddress: "Current Location" });
          setCity("Location error");
        } finally {
          setLoadingLocation(false);
        }
      },
      // ✅ error callback — was completely missing before
      (err) => {
        console.warn("Geolocation error:", err.message);
        setCity("Location denied");
        setLoadingLocation(false);
      }
    );
  }, []);

  return (
    <AppContext.Provider
      value={{ isAuth, loading, setIsAuth, setLoading, setUser, user, location, loadingLocation, city }}
    >
      {children}
      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }
  return context;
};