"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

// Function to get location ID from slug (same as in location page)
export function getLocationIdFromSlug(slug: string): number | null {
  // Extract ID from slug (format: "restaurant-name-123")
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  const id = parseInt(lastPart);
  return isNaN(id) ? null : id;
}

export function useLocationFromUrl() {
  const pathname = usePathname();

  const locationInfo = useMemo(() => {
    // Match 'location' anywhere in the pathname after an optional language prefix
    const locMatch = pathname.match(/\/location\/(.+)$/);
    if (locMatch) {
      const slug = locMatch[1];
      const locationId = getLocationIdFromSlug(slug);

      if (locationId) {
        return {
          locationId,
          locationName: slug.replace(`-${locationId}`, "").replace(/-/g, " "),
          isLocationPage: true,
        };
      }
    }

    // Match 'restaurant' anywhere in the pathname after an optional language prefix
    const restMatch = pathname.match(/\/restaurant\/(.+)$/);
    if (restMatch) {
      const slug = restMatch[1];
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
