"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

// Function to get location ID from slug (same as in location page)
function getLocationIdFromSlug(slug: string): number | null {
  // Extract ID from slug (format: "restaurant-name-123")
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  const id = parseInt(lastPart);
  return isNaN(id) ? null : id;
}

export function useLocationFromUrl() {
  const pathname = usePathname();

  const locationInfo = useMemo(() => {
    // Check if we're on a location page
    if (pathname.startsWith("/location/")) {
      const slug = pathname.replace("/location/", "");
      const locationId = getLocationIdFromSlug(slug);

      if (locationId) {
        return {
          locationId,
          locationName: slug.replace(`-${locationId}`, "").replace(/-/g, " "),
          isLocationPage: true,
        };
      }
    }

    // Check if we're on a restaurant page (for backward compatibility)
    if (pathname.startsWith("/restaurant/")) {
      const slug = pathname.replace("/restaurant/", "");
      // For restaurant pages, we'll use a default location ID based on the slug
      // This is for backward compatibility with existing restaurant pages
      const defaultLocationId =
        slug === "kfc-syntagma"
          ? 1
          : slug === "mcdonalds-omonia"
          ? 2
          : slug === "burger-king-monastiraki"
          ? 3
          : 999;

      return {
        locationId: defaultLocationId,
        locationName: slug.replace(/-/g, " "),
        isLocationPage: false,
      };
    }

    return {
      locationId: null,
      locationName: null,
      isLocationPage: false,
    };
  }, [pathname]);

  return locationInfo;
}

