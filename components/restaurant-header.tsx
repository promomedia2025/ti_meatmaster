"use client";

import Image from "next/image";

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
  onFavorite: (locationId: number) => Promise<{ success: boolean; error?: string }>;
  onUnfavorite: (locationId: number) => Promise<{ success: boolean; error?: string }>;
}

export default function RestaurantHeader({
  restaurant,
}: RestaurantHeaderProps) {
  return (
    <div className="relative h-64 md:h-96 overflow-hidden -mt-[150px] md:-mt-[80px] pt-[100px] md:pt-[80px]">
      {/* Hero image */}
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

      {/* Restaurant Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 max-w-[1600px] mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
          {restaurant.name}
        </h1>
        <p className="text-gray-200 text-sm md:text-base">
          {restaurant.description}
        </p>
      </div>
    </div>
  );
}
