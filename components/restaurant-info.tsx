import {
  MapPin,
  Star,
  Clock,
  Euro,
  Info,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { RestaurantStatus } from "@/lib/types";
import {
  getRestaurantStatusDisplay,
  getStatusTextClasses,
} from "@/lib/restaurant-status";

interface Restaurant {
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  minOrder: string;
  restaurant_status?: RestaurantStatus;
}

interface RestaurantInfoProps {
  restaurant: Restaurant;
}

export default function RestaurantInfo({ restaurant }: RestaurantInfoProps) {
  const statusDisplay = getRestaurantStatusDisplay(
    restaurant.restaurant_status,
    true, // fallback status
    true, // fallback delivery
    true // fallback pickup
  );

  return (
    <div className="bg-black/60  px-4 py-3">
      <div className="flex items-center gap-6 text-sm text-gray-300 flex-wrap">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400" />
          <span>{restaurant.rating}</span>
        </div>

        <div
          className={`flex items-center gap-1 ${getStatusTextClasses(
            statusDisplay.isOpen
          )}`}
        >
          <Clock className="w-4 h-4" />
          <span>{`${
            statusDisplay.statusMessage ===
            "We are OPEN, Pick up is available, Delivery is available"
              ? "Aνοικτό"
              : "Κλειστό"
          }`}</span>
        </div>

        {statusDisplay.deliveryAvailable && (
          <div className="flex items-center gap-1 text-green-400">
            <Truck className="w-4 h-4" />
            <span>Παράδοση</span>
          </div>
        )}

        {statusDisplay.pickupAvailable && (
          <div className="flex items-center gap-1 text-blue-400">
            <ShoppingBag className="w-4 h-4" />
            <span>Παραλαβή</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Euro className="w-4 h-4" />
          <span>Ελάχιστη παραγγελία 7.00€</span>
        </div>
      </div>
    </div>
  );
}
