"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Location } from "@/lib/types";
import { getRestaurantStatusDisplay } from "@/lib/restaurant-status";

export default function FavoritesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Small delay to allow auth context to initialize
    const timer = setTimeout(() => {
      setAuthChecked(true);
      if (!isAuthenticated) {
        router.push("/");
        return;
      }
      fetchFavorites();
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/user/favorites");
      const data = await response.json();


      if (data.success && data.data && data.data.favorites) {
        // API returns favorites as an array of objects with location property
        // Extract the location objects from the favorites array
        const locations = data.data.favorites.map(
          (favorite: any) => favorite.location
        );
        setFavorites(locations);
      } else if (data.success && data.data && data.data.locations) {
        // Fallback: handle locations format
        setFavorites(data.data.locations);
      } else if (data.success && Array.isArray(data.data)) {
        // Handle case where API returns array directly
        setFavorites(data.data);
      } else {
        setError(data.message || "Failed to load favorites");
      }
    } catch (err) {
      setError("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

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

  // Helper function to get thumbnail URL
  const getThumbnailUrl = (location: any) => {
    // Check if thumbnail is directly on the location object (from API)
    if (location.thumbnail && typeof location.thumbnail === "string") {
      return location.thumbnail;
    }
    // Fallback to images.thumbnail.url structure
    if (location.images && !Array.isArray(location.images)) {
      const images = location.images as { thumbnail?: { url: string } };
      if (images.thumbnail?.url) {
        return images.thumbnail.url;
      }
    }
    return "/placeholder.jpg";
  };

  // Helper function to get status badge classes
  const getStatusBadgeClasses = (isOpen: boolean) => {
    return isOpen ? "bg-green-500 text-white" : "bg-gray-500 text-white";
  };

  // Don't show content until auth is checked to prevent unwanted redirects
  if (!authChecked || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">
          {!authChecked ? "Loading..." : "Redirecting..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/user"
              className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-400 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Αγαπημένα</h1>
              <p className="text-gray-400">
                {favorites.length}{" "}
                {favorites.length === 1 ? "εστιατόριο" : "εστιατόρια"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Φόρτωση αγαπημένων...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={fetchFavorites}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Δοκιμή ξανά
            </button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Δεν έχετε αγαπημένα ακόμα
            </h2>
            <p className="text-gray-400 mb-6">
              Προσθέστε εστιατόρια στα αγαπημένα σας για να τα βρείτε εύκολα
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Εξερευνήστε εστιατόρια
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 max-w-[1600px] w-full mx-auto">
            {favorites.map((location) => {
              const slug = generateSlug(location.name, location.id);
              const deliveryTime = getDeliveryTime(location);
              const deliveryFee = getDeliveryFee(location);
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
                  className="flex flex-col bg-gray-900 hover:border-gray-700 cursor-pointer transition-all duration-200 hover:shadow-lg rounded-lg overflow-hidden border border-gray-800 group"
                >
                  {/* Image Container */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={location.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <span className="text-xs text-gray-500">No Image</span>
                      </div>
                    )}
                    {/* Restaurant Status Badge */}
                    <div
                      className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClasses(
                        statusDisplay.isOpen
                      )}`}
                    >
                      {statusDisplay.isOpen ? "Άνοιχτό" : "Κλειστό"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
                    <h3
                      className="font-medium text-white text-sm sm:text-base mb-1 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {location.name}
                    </h3>
                    <p
                      className="text-xs sm:text-sm text-gray-400 mb-2 flex-1 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {location.address?.line_1 && location.address?.city
                        ? `${location.address.line_1}, ${location.address.city}`
                        : location.description ||
                          location.address?.city ||
                          "No description"}
                    </p>

                    {/* Service Availability */}
                    <div className="flex items-center gap-2 mb-2">
                      {statusDisplay.deliveryAvailable && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Delivery
                        </span>
                      )}
                      {statusDisplay.pickupAvailable && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          Pickup
                        </span>
                      )}
                    </div>

                    {/* Delivery time and fee */}
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
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
                        <span>{deliveryTime} λεπτά</span>
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
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
