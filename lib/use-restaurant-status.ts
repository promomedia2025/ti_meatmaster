"use client";

import { useState, useEffect, useRef } from "react";
import { RestaurantStatus, LocationsResponse } from "./types";

interface UseRestaurantStatusReturn {
  status: RestaurantStatus | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch restaurant status for a specific location
 * @param locationId - The ID of the location/restaurant
 * @returns Object containing status, isLoading, and error
 */
export function useRestaurantStatus(
  locationId: number | null | undefined
): UseRestaurantStatusReturn {
  const [status, setStatus] = useState<RestaurantStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Don't fetch if locationId is not provided
    if (!locationId) {
      setStatus(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchRestaurantStatus = async () => {
      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/locations", {
          signal: abortControllerRef.current.signal,
          cache: "no-store", // No caching
        });
        const data: LocationsResponse = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch locations");
        }

        // Find the location with matching ID
        const location = data.data.locations.find(
          (loc) => loc.id === locationId
        );

        if (!location) {
          throw new Error(`Location with ID ${locationId} not found`);
        }

        // Extract restaurant_status from the location
        const restaurantStatus = location.restaurant_status || null;
        setStatus(restaurantStatus);
      } catch (err) {
        // Don't set error if request was aborted
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch restaurant status";
        setError(errorMessage);
        setStatus(null);
        console.error("Error fetching restaurant status:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantStatus();

    // Cleanup: abort request on unmount or locationId change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [locationId]);

  return { status, isLoading, error };
}

