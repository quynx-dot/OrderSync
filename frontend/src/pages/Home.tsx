import { useSearchParams } from "react-router-dom"
import { useAppData } from "../context/AppContext"
import type { IRestaurant } from "../types";
import { useEffect, useState } from "react";
import { restaurantService } from "../main";
import axios from "axios";
import RestaurantCard from "../components/RestaurantCard";

// FIX: The backend aggregation already returns distanceKm on every restaurant.
// The frontend was re-computing distance client-side with getDistanceKm(),
// which was redundant and ran on every render. Removed entirely.

const Home = () => {
  const { location } = useAppData();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = async () => {
    if (!location?.latitude || !location?.longitude) {
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(`${restaurantService}/api/restaurants/all`, {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          search,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setRestaurants(data.restaurants ?? []);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [location, search]);

  if (loading || !location) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-500">Finding restaurants near you...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {restaurants.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {restaurants.map((res) => (
            // FIX: use res.distanceKm from the backend aggregation instead of
            // recomputing it client-side. The $geoNear pipeline already adds this.
            <RestaurantCard
              key={res._id}
              id={res._id}
              name={res.name}
              image={res.image ?? ""}
              distance={`${(res as any).distanceKm ?? "?"}`}
              isOpen={res.isOpen}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No restaurants found near you.</p>
      )}
    </div>
  );
};

export default Home;