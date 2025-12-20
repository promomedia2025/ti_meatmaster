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
  locationData?: {
    options?: {
      delivery_time_interval?: number;
      delivery_min_order_amount?: string;
      collection_time_interval?: number;
      collection_min_order_amount?: string;
      offer_delivery?: string;
      offer_collection?: string;
    };
  };
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
            <span>Delivery</span>
            {restaurant.locationData?.options?.delivery_time_interval && (
              <>
                <span className="text-gray-400">•</span>
                <span>{restaurant.locationData.options.delivery_time_interval} λεπτά</span>
              </>
            )}
            {restaurant.locationData?.options?.delivery_min_order_amount && (
              <>
                <span className="text-gray-400">•</span>
                <span>Ελάχ. {restaurant.locationData.options.delivery_min_order_amount}€</span>
              </>
            )}
          </div>
        )}

        {statusDisplay.pickupAvailable && (
          <div className="flex items-center gap-1 text-blue-400">
            <ShoppingBag className="w-4 h-4" />
            <span>Pickup</span>
            {restaurant.locationData?.options?.collection_time_interval && (
              <>
                <span className="text-gray-400">•</span>
                <span>{restaurant.locationData.options.collection_time_interval} λεπτά</span>
              </>
            )}
            {restaurant.locationData?.options?.collection_min_order_amount && (
              <>
                <span className="text-gray-400">•</span>
                <span>Ελάχ. {restaurant.locationData.options.collection_min_order_amount}€</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
