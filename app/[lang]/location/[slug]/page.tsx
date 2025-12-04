import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import RestaurantHeader from "@/components/restaurant-header";
import RestaurantInfo from "@/components/restaurant-info";
import RestaurantMenu from "@/components/restaurant-menu";
import { DeliveryAvailabilityChecker } from "@/components/delivery-availability-checker";
import {
  Location,
  LocationsResponse,
  MenuCategoriesResponse,
  MenuItemsResponse,
} from "@/lib/types";
import { favoriteLocation, unfavoriteLocation } from "./actions";

export const dynamic = "force-dynamic";

// Server-side function to check favorite status
async function getFavoriteStatus(
  locationId: number,
  cookieHeader?: string
): Promise<boolean> {
  try {
    const url = `https://cocofino.bettersolution.gr/api/locations/${locationId}/is-favorite`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add cookies if available
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
      console.log(
        "❤️ [GET FAVORITE STATUS] Making request with cookies to:",
        url
      );
    } else {
      console.warn(
        "❤️ [GET FAVORITE STATUS] ⚠️ No cookies found for authentication"
      );
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store", // Don't cache - always fetch fresh favorite status
    });

    console.log("❤️ [GET FAVORITE STATUS] Response status:", response.status);
    console.log("❤️ [GET FAVORITE STATUS] Response OK:", response.ok);

    if (response.ok) {
      const responseText = await response.text();
      const data = JSON.parse(responseText);
      const favoriteStatus = data.data?.is_favorite || false;
      console.log("❤️ [GET FAVORITE STATUS] Favorite status:", favoriteStatus);
      return favoriteStatus;
    } else {
      console.error(
        "❤️ [GET FAVORITE STATUS] ❌ Failed to get favorite status:",
        response.status
      );
      return false;
    }
  } catch (error) {
    console.error("❤️ [GET FAVORITE STATUS] 💥 Exception:", error);
    return false;
  }
}

interface LocationPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    category?: string;
  };
}

// Function to get location ID from slug
function getLocationIdFromSlug(slug: string): number | null {
  // Extract ID from slug (format: "restaurant-name-123")
  const parts = slug.split("-");
  const lastPart = parts[parts.length - 1];
  const id = parseInt(lastPart);
  return isNaN(id) ? null : id;
}

// Function to get location data from API
async function getLocationData(slug: string): Promise<Location | null> {
  try {
    const locationId = getLocationIdFromSlug(slug);
    if (!locationId) {
      return null;
    }

    // Fetch location data directly from external API
    const response = await fetch(
      `https://cocofino.bettersolution.gr/api/locations`,
      {
        cache: "no-store", // Ensure fresh data
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: LocationsResponse = await response.json();

    if (data.success && data.data.locations) {
      // Find the location with matching ID
      const location = data.data.locations.find((loc) => loc.id === locationId);
      return location || null;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Correct final version: maintains original API shape
async function getMenuData(locationId: number, categorySlug?: string) {
  try {
    let page = 1;
    const perPage = 100;
    const allItems: any[] = [];

    while (true) {
      let apiUrl = `https://cocofino.bettersolution.gr/api/locations/${locationId}/menu-items?page=${page}&per_page=${perPage}`;

      if (categorySlug) {
        apiUrl += `&category_slug=${categorySlug}`;
      }

      const response = await fetch(apiUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const json = await response.json();
      allItems.push(...json.data.menu_items);

      const { current_page, last_page } = json.data.pagination;
      if (current_page >= last_page) break;

      page++;
    }

    return {
      success: true,
      data: {
        menu_items: allItems,  // ← restore original shape
      },
    };

  } catch (error) {
    console.error("Failed to fetch menu data:", error);

    return {
      success: false,
      data: {
        menu_items: [],
      },
    };
  }
}


// Function to get menu categories from API
async function getMenuCategories(locationId: number) {
  try {
    const response = await fetch(
      `https://cocofino.bettersolution.gr/api/locations/${locationId}/menu-categories`,
      {
        cache: "no-store", // Ensure fresh data
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data: MenuCategoriesResponse = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

export default async function LocationPage({
  params,
  searchParams,
}: LocationPageProps) {
  const location = await getLocationData(params.slug);

  if (!location) {
    notFound();
  }

  // Get cookies from the request and format them properly
  const cookieStore = cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  console.log(
    "❤️ [GET FAVORITE STATUS] Cookies available:",
    cookieHeader ? "Yes" : "No"
  );

  // Fetch favorite status server-side
  const isFavorite = await getFavoriteStatus(location.id, cookieHeader);

  // Ensure we always have a boolean value
  const favoriteStatus = Boolean(isFavorite);

  const menuCategoriesData = await getMenuCategories(location.id);
  const selectedCategorySlug = searchParams.category;

  // Find the category name for the selected category slug
  const selectedCategoryData = menuCategoriesData?.data?.categories?.find(
    (cat) => cat.permalink_slug === selectedCategorySlug
  );
  const selectedCategoryName = selectedCategoryData?.name || "All Items";

  const menuData = await getMenuData(location.id, selectedCategorySlug);

  // Transform location data to match restaurant format
  const restaurant = {
    id: params.slug,
    name: location.name,
    description:
      location.description ||
      `${location.address.city} • ${location.address.line_1}`,
    image:
      location.images &&
      !Array.isArray(location.images) &&
      location.images.thumbnail
        ? location.images.thumbnail.url
        : "/placeholder.svg",
    heroImage:
      location.images &&
      !Array.isArray(location.images) &&
      location.images.thumbnail
        ? location.images.thumbnail.url
        : "/placeholder.svg",
    rating: 8.5, // Default rating since it's not in the API
    deliveryTime: `${location.options?.delivery_lead_time || 25}-${
      (location.options?.delivery_lead_time || 25) + 10
    }`,
    deliveryFee:
      location.options?.delivery_min_order_amount === "0.00" ? "0.00" : "1.50",
    minOrder: location.options?.delivery_min_order_amount || "5.00",
    restaurant_status: location.restaurant_status, // Pass restaurant status to components
    categories: menuCategoriesData?.data?.categories
      ? [
          ...menuCategoriesData.data.categories.map((cat) => cat.name),
        ]
      : menuData?.data?.menu_items
      ? ["All Items", "Popular", "Specials"]
      : ["All Items"], // Basic categories
    menuData: menuData, // Pass menu data to components
    menuCategoriesData: menuCategoriesData, // Pass menu categories data to components
    locationData: location, // Pass location data to components
    selectedCategory: selectedCategoryName, // Pass selected category to components
  };

  return (
    <div className="min-h-screen bg-black">
  <DeliveryAvailabilityChecker
    locationId={location.id}
    deliveryAvailable={location.restaurant_status?.delivery_available ?? true}
  />

  <RestaurantHeader
    restaurant={restaurant}
    isFavorite={favoriteStatus}
    onFavorite={favoriteLocation}
    onUnfavorite={unfavoriteLocation}
  />

  {/* Only info is centered */}
  <div className="max-w-[1600px] mx-auto">
    <RestaurantInfo restaurant={restaurant} />
  </div>

  {/* Menu is full-width */}
  <Suspense
    fallback={
      <div className="text-center py-8 text-white">Loading menu...</div>
    }
  >
    <RestaurantMenu restaurant={restaurant} />
  </Suspense>
</div>
  );
}
