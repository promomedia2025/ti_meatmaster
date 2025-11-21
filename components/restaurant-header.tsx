"use client";

import Image from "next/image";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import FavoriteButton from "./favorite-button";
import { useServerCart } from "@/lib/server-cart-context";
import { useCartSidebar } from "@/lib/cart-sidebar-context";

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
  const { getLocationCart } = useServerCart();
  const { setIsCartSidebarOpen, setCartViewLocationId } = useCartSidebar();

  // Function to get location ID from restaurant data
  const getLocationId = (): number | null => {
    // Try to get from locationData first (from location page)
    if (restaurant.locationData?.id) {
      return restaurant.locationData.id;
    }

    // Fallback: extract from restaurant.id (for restaurant page)
    const parts = restaurant.id.split("-");
    const lastPart = parts[parts.length - 1];
    const id = parseInt(lastPart);
    return isNaN(id) ? null : id;
  };

  const locationId = getLocationId();

  if (locationId === null) {
    return null;
  }

  // Create wrapper functions that include the locationId
  const handleFavorite = () => onFavorite(locationId);
  const handleUnfavorite = () => onUnfavorite(locationId);

  const cart = getLocationCart(locationId);
  const hasCart = cart && cart.items.length > 0;

  return (
    <div className="relative h-64 md:h-80 overflow-hidden">
      {/* Hero Image */}
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

      {/* Header Navigation */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <Link
          href="/"
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-3">
          {/* Desktop Cart Button - Only show if cart exists */}
          {hasCart && (
            <button
              onClick={() => {
                setCartViewLocationId(locationId);
                setIsCartSidebarOpen(true);
              }}
              className="hidden md:flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-2xl transition-all duration-200 shadow-2xl shadow-blue-500/25 backdrop-blur-sm"
            >
              {cart.summary.count > 0 && (
                <span className="bg-white text-blue-500 text-sm font-bold px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                  {cart.summary.count}
                </span>
              )}
              <ShoppingCart className="w-4 h-4" />
              <span>Δες την παραγγελία σου</span>
              {cart.summary.total > 0 && (
                <span className="text-sm font-bold">
                  €{cart.summary.total.toFixed(2)}
                </span>
              )}
            </button>
          )}


        </div>
      </div>

      {/* Restaurant Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/"
            className="w-16 h-16 bg-white rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Image
              src="/kfc-logo.jpg"
              alt={restaurant.name}
              width={40}
              height={40}
              className="object-contain"
            />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {restaurant.name}
            </h1>
            <p className="text-gray-200 text-sm md:text-base">
              {restaurant.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
