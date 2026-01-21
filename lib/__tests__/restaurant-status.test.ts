import {
  getRestaurantStatusDisplay,
  getStatusBadgeClasses,
  getStatusTextClasses,
} from "../restaurant-status";
import { RestaurantStatus } from "../types";

describe("Restaurant Status Utilities", () => {
  describe("getRestaurantStatusDisplay", () => {
    it("should return correct status when restaurant_status is provided", () => {
      const restaurantStatus: RestaurantStatus = {
        is_open: false,
        pickup_available: false,
        delivery_available: false,
        next_opening_time: "2024-01-01T09:00:00Z",
        status_message: "Είμαστε Κλειστά",
      };

      const result = getRestaurantStatusDisplay(restaurantStatus);

      expect(result).toEqual({
        isOpen: false,
        deliveryAvailable: false,
        pickupAvailable: false,
        statusMessage: "Είμαστε Κλειστά",
        nextOpeningTime: "2024-01-01T09:00:00Z",
      });
    });

    it("should return fallback values when restaurant_status is not provided", () => {
      const result = getRestaurantStatusDisplay(undefined, false, false, true);

      expect(result).toEqual({
        isOpen: false,
        deliveryAvailable: false,
        pickupAvailable: true,
        statusMessage: "Closed",
      });
    });

    it("should handle open restaurant with both services available", () => {
      const restaurantStatus: RestaurantStatus = {
        is_open: true,
        pickup_available: true,
        delivery_available: true,
        next_opening_time: null,
        status_message: "We are OPEN",
      };

      const result = getRestaurantStatusDisplay(restaurantStatus);

      expect(result.isOpen).toBe(true);
      expect(result.deliveryAvailable).toBe(true);
      expect(result.pickupAvailable).toBe(true);
      expect(result.statusMessage).toBe("We are OPEN");
    });
  });

  describe("getStatusBadgeClasses", () => {
    it("should return green classes for open restaurant", () => {
      const classes = getStatusBadgeClasses(true);
      expect(classes).toBe("bg-green-500 text-white");
    });

    it("should return red classes for closed restaurant", () => {
      const classes = getStatusBadgeClasses(false);
      expect(classes).toBe("bg-red-500 text-white");
    });
  });

  describe("getStatusTextClasses", () => {
    it("should return green classes for open restaurant", () => {
      const classes = getStatusTextClasses(true);
      expect(classes).toBe("text-green-400");
    });

    it("should return red classes for closed restaurant", () => {
      const classes = getStatusTextClasses(false);
      expect(classes).toBe("text-red-400");
    });
  });
});
