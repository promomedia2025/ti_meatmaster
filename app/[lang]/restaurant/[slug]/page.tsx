import { notFound } from "next/navigation";
import { Suspense } from "react";
import RestaurantHeader from "@/components/restaurant-header";
import RestaurantInfo from "@/components/restaurant-info";
import RestaurantMenu from "@/components/restaurant-menu";

export const dynamic = "force-dynamic";

// Function to get location ID from slug
function getLocationIdFromSlug(slug: string): number | null {
  // Extract ID from slug (format: "restaurant-name-123")
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  const id = parseInt(lastPart);
  return isNaN(id) ? null : id;
}

// Server-side function to check favorite status
async function getFavoriteStatus(locationId: number): Promise<boolean> {
  try {
    console.log(
      "🔍 [Server] Checking favorite status for location_id:",
      locationId
    );

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/api/locations/${locationId}/is-favorite`;
    console.log("📡 [Server] Making request to:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add cache control for server-side requests
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    console.log(
      "📊 [Server] Response status:",
      response.status,
      response.statusText
    );

    if (response.ok) {
      // Log the raw response text first
      const responseText = await response.text();
      console.log("📄 [Server] Raw response text:", responseText);

      // Parse the JSON
      const data = JSON.parse(responseText);
      console.log("📦 [Server] Parsed API response:", JSON.stringify(data));
      console.log("📦 [Server] Response type:", typeof data);
      console.log("📦 [Server] Response keys:", Object.keys(data));
      console.log(
        "💖 [Server] Extracted is_favorite value:",
        data.data?.is_favorite
      );

      const favoriteStatus = data.data?.is_favorite || false;
      console.log("❤️ [Server] Setting favorite status to:", favoriteStatus);
      return favoriteStatus;
    } else {
      console.error(
        "❌ [Server] Failed to check favorite status:",
        response.statusText
      );
      console.log("🔧 [Server] Setting favorite status to false due to error");
      return false;
    }
  } catch (error) {
    console.error("💥 [Server] Error checking favorite status:", error);
    console.log(
      "🔧 [Server] Setting favorite status to false due to exception"
    );
    return false;
  }
}

// Mock restaurant data - in a real app this would come from a database
const restaurants = {
  "kfc-syntagma": {
    id: "kfc-syntagma",
    name: "KFC Σύνταγμα",
    description: "Το πιο διάσημο τηγανητό κοτόπουλο, στη πόρτα σου!",
    image: "/kfc-bucket.jpg",
    heroImage: "/kfc-hero.jpg",
    rating: 8.4,
    deliveryTime: "20-30",
    deliveryFee: "0.00",
    minOrder: "6.00",
    categories: [
      "Δημοφιλή",
      "OFFERS",
      "BUCKET FOR 1",
      "BURGER MENU",
      "BURGERS",
      "WRAP MENU",
      "WRAPS",
      "CHICKEN MENU",
      "CHICKEN",
      "BUCKET MENU",
    ],
  },
  "mcdonalds-syntagma": {
    id: "mcdonalds-syntagma",
    name: "McDonald's Σύνταγμα",
    description: "Τα πιο νόστιμα γεύματα!",
    image: "/mcdonalds-meal.jpg",
    heroImage: "/mcdonalds-hero.jpg",
    rating: 8.6,
    deliveryTime: "15-25",
    deliveryFee: "0.50",
    minOrder: "5.00",
    categories: [
      "Δημοφιλή",
      "OFFERS",
      "BURGERS",
      "CHICKEN",
      "BREAKFAST",
      "DESSERTS",
      "DRINKS",
    ],
  },
  "cocofino-6": {
    id: "cocofino-6",
    name: "Cocofino",
    description: "Fresh and delicious food!",
    image: "/placeholder.jpg",
    heroImage: "/placeholder.jpg",
    rating: 8.5,
    deliveryTime: "25-35",
    deliveryFee: "1.00",
    minOrder: "8.00",
    categories: ["Δημοφιλή", "SALADS", "WRAPS", "DRINKS"],
  },
};

interface RestaurantPageProps {
  params: {
    slug: string;
  };
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  console.log("🏪 [Server] RestaurantPage params:", params);

  // Get location ID from the URL slug
  const locationId = getLocationIdFromSlug(params.slug);
  console.log("📍 [Server] Extracted locationId from slug:", locationId);

  const restaurant = restaurants[params.slug as keyof typeof restaurants];
  console.log("🏪 [Server] Found restaurant:", restaurant);

  if (!restaurant) {
    console.log("❌ [Server] Restaurant not found, calling notFound()");
    notFound();
  }

  if (!locationId) {
    console.log("❌ [Server] No locationId found in slug, calling notFound()");
    notFound();
  }

  // Fetch favorite status server-side
  console.log(
    "🚀 [Server] About to call getFavoriteStatus for location_id:",
    locationId
  );
  const isFavorite = await getFavoriteStatus(locationId);
  console.log(
    "✅ [Server] getFavoriteStatus returned:",
    isFavorite,
    "Type:",
    typeof isFavorite
  );

  // Ensure we always have a boolean value
  const favoriteStatus = Boolean(isFavorite);
  console.log(
    "🔧 [Server] Final favoriteStatus:",
    favoriteStatus,
    "Type:",
    typeof favoriteStatus
  );

  console.log(
    "🎨 [Server] Rendering RestaurantHeader with favoriteStatus:",
    favoriteStatus,
    "Type:",
    typeof favoriteStatus
  );

  return (
    <div className="min-h-screen bg-black">
      <RestaurantHeader restaurant={restaurant} isFavorite={favoriteStatus} />
      <div className="max-w-[1600px] mx-auto">
        <RestaurantInfo restaurant={restaurant} />
        <Suspense
          fallback={
            <div className="text-center py-8 text-white">Loading menu...</div>
          }
        >
          <RestaurantMenu restaurant={restaurant} />
        </Suspense>
      </div>
    </div>
  );
}
