"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Location, LocationsResponse } from "@/lib/types";
import { useRestaurantUpdates } from "@/lib/pusher-context";
import { useLocation } from "@/lib/location-context";
import {
  getRestaurantStatusDisplay,
  getStatusBadgeClasses,
} from "@/lib/restaurant-status";

interface RestaurantGridProps {
  radius?: number;
}

export function RestaurantGrid({ radius = 5 }: RestaurantGridProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { coordinates } = useLocation();
  const searchParams = useSearchParams();
  // Real-time updates from Pusher
  const { restaurants: realTimeRestaurants } = useRestaurantUpdates();

  // Merge real-time updates with existing locations
  useEffect(() => {
    if (realTimeRestaurants.length > 0) {
      setLocations((prevLocations) => {
        // Merge real-time updates with existing locations
        const updatedLocations = [...prevLocations];

        realTimeRestaurants.forEach((realTimeRestaurant) => {
          const existingIndex = updatedLocations.findIndex(
            (loc) => loc.id === realTimeRestaurant.id
          );

          if (existingIndex >= 0) {
            // Update existing restaurant
            updatedLocations[existingIndex] = {
              ...updatedLocations[existingIndex],
              ...realTimeRestaurant,
            };
          } else {
            // Add new restaurant
            updatedLocations.push(realTimeRestaurant);
          }
        });

        return updatedLocations;
      });
    }
  }, [realTimeRestaurants]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams();

        // Add coordinates if available
        if (coordinates) {
          const { latitude, longitude } = coordinates;
          params.set("latitude", latitude.toString());
          params.set("longitude", longitude.toString());
          params.set("radius", radius.toString());
        }

        // Add tags filter if available
        const tagsParam = searchParams.get("tags");
        if (tagsParam) {
          params.set("tags", tagsParam);
        }

        const apiUrl = `/api/locations${
          params.toString() ? `?${params.toString()}` : ""
        }`;

        const response = await fetch(apiUrl);
        const data: LocationsResponse = await response.json();

        if (data.success) {
          setLocations(data.data.locations);
        } else {
          setError(data.message || "Failed to fetch locations");
        }
      } catch (err) {
        setError("Failed to fetch locations");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [coordinates, searchParams, radius]);

  // Helper function to generate a slug from the restaurant name
  const generateSlug = (name: string, id: number) => {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim() + `-${id}`
    );
  };

  // Helper function to get delivery time from options
  const getDeliveryTime = (location: Location) => {
    const leadTime = location.options?.delivery_lead_time || 25;
    return `${leadTime}-${leadTime + 10}`;
  };

  // Helper function to get delivery fee
  const getDeliveryFee = (location: Location) => {
    const minAmount = location.options?.delivery_min_order_amount;
    return minAmount === "0.00" ? "0.00" : "1.50";
  };

  // Helper function to get a random rating (since it's not in the API)
  const getRandomRating = (id: number) => {
    const ratings = ["8.4", "8.6", "9.0", "9.2", "9.4", "9.6"];
    return ratings[id % ratings.length];
  };

  // Helper function to get a random promotion
  const getRandomPromotion = (id: number) => {
    const promotions = [
      "10% Off | 30% with W+",
      "-15% στη παραγγελία σου",
      "-4€ στη παραγγελία σου",
      "Δωρεάν παράδοση",
      "Νέο μενού",
    ];
    return promotions[id % promotions.length];
  };

  // Helper function to get the thumbnail image URL
  const getThumbnailUrl = (location: Location) => {
    // Check if images is an object (not an empty array)
    if (
      location.images &&
      !Array.isArray(location.images) &&
      location.images.thumbnail
    ) {
      return location.images.thumbnail.url;
    }
    return "/placeholder.svg";
  };

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Όλα τα εστιατόρια
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-card rounded-lg overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-muted"></div>
              <div className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-3"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-8">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Όλα τα εστιατόρια
        </h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Error: {error}</p>
        </div>
      </section>
    );
  }
  return (
    <section className="mt-8">

        {locations.map((location) => {
          const slug = generateSlug(location.name, location.id);
          const deliveryTime = getDeliveryTime(location);
          const deliveryFee = getDeliveryFee(location);
          const rating = getRandomRating(location.id);
          const promotion = getRandomPromotion(location.id);
          const thumbnailUrl = getThumbnailUrl(location);
          const statusDisplay = getRestaurantStatusDisplay(
            location.restaurant_status,
            location.status,
            location.options?.offer_delivery === "1",
            location.options?.offer_collection === "1"
          );

          return (
            <Link
              key={location.id}
              href={`/location/${slug}`}
              className="w-full max-w-[1600px] bg-card rounded-lg overflow-hidden hover:bg-card/80 transition-colors cursor-pointer block"
            >
              <div className="relative aspect-[4/1]">
                <Image
                  src={thumbnailUrl}
                  alt={location.name}
                  fill
                  priority
                  fetchPriority="high"
                />
                
                {/* Restaurant Status Badge */}
                <div
                  className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClasses(
                    statusDisplay.isOpen
                  )}`}
                >
                  {statusDisplay.isOpen ? "Άνοιχτό" : "Κλειστό"}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1">
                  {location.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                  {location.description ||
                    `${location.address.city} • ${location.address.line_1}`}
                </p>

                {/* Status Message */}
                <p className="text-xs text-muted-foreground mb-3">
                  {statusDisplay.statusMessage}
                </p>

                {/* Service Availability */}
                <div className="flex items-center gap-2 mb-3">
                  {statusDisplay.deliveryAvailable && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Παράδοση
                    </span>
                  )}
                  {statusDisplay.pickupAvailable && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                      Παραλαβή
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{deliveryTime}</span>
                      <span className="text-primary">λεπτά</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span>{deliveryFee}€</span>
                      <span>• €</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3 fill-yellow-400"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>{rating}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
    </section>
  );
}
