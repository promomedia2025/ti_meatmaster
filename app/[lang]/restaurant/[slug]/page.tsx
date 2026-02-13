import { notFound } from "next/navigation";
import { Suspense } from "react";
import RestaurantHeader from "@/components/restaurant-header";
import RestaurantInfo from "@/components/restaurant-info";
import RestaurantMenu from "@/components/restaurant-menu";
import { Skeleton } from "@/components/ui/skeleton";

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

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${baseUrl}/api/locations/${locationId}/is-favorite`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add cache control for server-side requests
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    

    if (response.ok) {
      // Log the raw response text first
      const responseText = await response.text();

      // Parse the JSON
      const data = JSON.parse(responseText);
     

      const favoriteStatus = data.data?.is_favorite || false;
      return favoriteStatus;
    } else {
      return false;
    }
  } catch (error) {
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
  "Perfetta-6": {
    id: "Perfetta-6",
    name: "Perfetta",
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

  // Get location ID from the URL slug
  const locationId = getLocationIdFromSlug(params.slug);

  const restaurant = restaurants[params.slug as keyof typeof restaurants];

  if (!restaurant) {
    notFound();
  }

  if (!locationId) {
    notFound();
  }

  // Fetch favorite status server-side
  const isFavorite = await getFavoriteStatus(locationId);

  // Ensure we always have a boolean value
  const favoriteStatus = Boolean(isFavorite);


  return (
    <div className="min-h-screen bg-black">
      <RestaurantHeader restaurant={restaurant} isFavorite={favoriteStatus} />
      <div className="max-w-[1600px] mx-auto">
        <RestaurantInfo restaurant={restaurant} />
        <Suspense
          fallback={
            <div className="bg-black relative w-full">
              {/* Sticky Nav Skeleton */}
              <div className="sticky top-[75px] w-full border-b border-gray-800 z-30 bg-[#242424]">
                <div className="max-w-[1600px] mx-auto px-4 pt-4 pb-2">
                  <div className="flex items-center gap-6 overflow-x-auto">
                    {[...Array(6)].map((_, index) => (
                      <Skeleton key={index} className="h-6 w-24" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Menu Content Skeleton */}
              <div className="max-w-[1600px] mx-auto px-4 py-6 pb-24 md:pb-6">
                {[...Array(3)].map((_, catIndex) => (
                  <div key={catIndex} className="mb-8">
                    <Skeleton className="h-7 w-48 mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 lg:gap-12">
                      {[...Array(3)].map((_, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="bg-transparent sm:bg-gray-900 rounded-lg overflow-hidden border-0 sm:border border-gray-800 flex pb-4 sm:pb-0"
                        >
                          {/* Left side - Text content */}
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                              <Skeleton className="h-6 w-3/4 mb-2" />
                              <Skeleton className="h-4 w-full mb-1" />
                              <Skeleton className="h-4 w-5/6" />
                            </div>
                            <div className="mt-3">
                              <Skeleton className="h-6 w-24" />
                              <Skeleton className="h-4 w-20 mt-1" />
                            </div>
                          </div>

                          {/* Right side - Image */}
                          <div className="relative w-32 h-32 flex-shrink-0 p-2.5">
                            <Skeleton className="w-full h-full rounded" />
                            <Skeleton className="absolute top-0 right-0 w-10 h-10 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <RestaurantMenu restaurant={restaurant} />
        </Suspense>
      </div>
    </div>
  );
}
