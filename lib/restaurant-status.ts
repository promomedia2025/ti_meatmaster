import { RestaurantStatus } from "./types";

export interface RestaurantStatusDisplay {
  isOpen: boolean;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  statusMessage: string;
  nextOpeningTime?: string | null;
}

/**
 * Helper function to get restaurant status display information
 * @param restaurantStatus - The restaurant status from the API
 * @param fallbackStatus - Fallback status if restaurant_status is not available
 * @param fallbackDelivery - Fallback delivery availability
 * @param fallbackPickup - Fallback pickup availability
 */
export function getRestaurantStatusDisplay(
  restaurantStatus?: RestaurantStatus,
  fallbackStatus: boolean = true,
  fallbackDelivery: boolean = true,
  fallbackPickup: boolean = true
): RestaurantStatusDisplay {
  if (!restaurantStatus) {
    return {
      isOpen: fallbackStatus,
      deliveryAvailable: fallbackDelivery,
      pickupAvailable: fallbackPickup,
      statusMessage: fallbackStatus ? "Open" : "Closed",
    };
  }

  return {
    isOpen: restaurantStatus.is_open,
    deliveryAvailable: restaurantStatus.delivery_available,
    pickupAvailable: restaurantStatus.pickup_available,
    statusMessage: restaurantStatus.status_message,
    nextOpeningTime: restaurantStatus.next_opening_time,
  };
}

/**
 * Get status badge color classes based on restaurant status
 */
export function getStatusBadgeClasses(isOpen: boolean): string {
  return isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white";
}

/**
 * Get status text color classes based on restaurant status
 */
export function getStatusTextClasses(isOpen: boolean): string {
  return isOpen ? "text-green-400" : "text-red-400";
}
