"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useServerCart } from "@/lib/server-cart-context";
import { useCartSidebar } from "@/lib/cart-sidebar-context";
import { useLocationFromUrl } from "@/lib/use-location-from-url";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  heroImage: string;
  locationData?: {
    id: number;
  };
}

interface RestaurantHeaderProps {
  restaurant: Restaurant;
  isFavorite?: boolean | null;
  onFavorite: (
    locationId: number
  ) => Promise<{ success: boolean; error?: string }>;
  onUnfavorite: (
    locationId: number
  ) => Promise<{ success: boolean; error?: string }>;
}

export default function RestaurantHeader({
  restaurant,
  isFavorite,
  onFavorite,
  onUnfavorite,
}: RestaurantHeaderProps) {
  const { locationId } = useLocationFromUrl();
  const { getLocationCart } = useServerCart();
  const { setCartViewLocationId, setIsCartSidebarOpen } = useCartSidebar();

  const locationCart = locationId ? getLocationCart(locationId) : null;

  return (
    <div className="relative h-64 md:h-96 overflow-hidden -mt-[150px] md:-mt-[80px] pt-[100px] md:pt-[80px]">
      {/* Hero Image - extends behind navbar */}
      <Image
        src={restaurant.heroImage || "/placeholder.svg"}
        alt={restaurant.name}
        fill
        className="object-cover"
        sizes="100vw"
        priority
        fetchPriority="high"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Desktop Cart Button - Top Right */}
      {locationId && (
        <div className="absolute top-20 right-4 md:right-4 2xl:right-50 z-20 hidden md:flex">
          <button
            onClick={() => {
              setCartViewLocationId(locationId);
              setIsCartSidebarOpen(true);
            }}
            className="flex items-center gap-2 lg:gap-3 bg-[#ff9328ff] hover:bg-[#915316] text-white font-medium py-2 lg:py-3 px-3 lg:px-4 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-500/25 backdrop-blur-sm"
          >
            {locationCart?.summary.count && locationCart.summary.count > 0 && (
              <span className="bg-white text-[#ff9328ff] text-sm font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                {locationCart.summary.count}
              </span>
            )}
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden lg:inline">Δες την παραγγελία σου</span>
            </div>
            {locationCart?.summary.total && locationCart.summary.total > 0 && (
              <div className="text-right">
                <div className="text-sm font-bold">
                  €{locationCart.summary.total.toFixed(2)}
                </div>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Restaurant Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 max-w-[1600px] mx-auto w-full">
        <div className="mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            {restaurant.name}
          </h1>
          <p className="text-gray-200 text-sm md:text-base">
            {restaurant.description}
          </p>
        </div>
      </div>
    </div>
  );
}
