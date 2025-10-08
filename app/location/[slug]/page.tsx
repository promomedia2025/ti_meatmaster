import { notFound } from "next/navigation";
import RestaurantHeader from "@/components/restaurant-header";
import RestaurantInfo from "@/components/restaurant-info";
import RestaurantMenu from "@/components/restaurant-menu";
import {
  Location,
  LocationsResponse,
  MenuCategoriesResponse,
  MenuItemsResponse,
} from "@/lib/types";

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

    // Fetch location data from our API
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/locations`,
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
    console.error("Error fetching location data:", error);
    return null;
  }
}

// Function to get menu data from API
async function getMenuData(locationId: number, categorySlug?: string) {
  try {
    let apiUrl = `https://multitake.bettersolution.gr/api/locations/${locationId}/menu-items`;
    if (categorySlug) {
      apiUrl += `&category_slug=${categorySlug}`;
    }

    const response = await fetch(apiUrl, {
      cache: "no-store", // Ensure fresh data
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data: MenuItemsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching menu data:", error);
    return null;
  }
}

// Function to get menu categories from API
async function getMenuCategories(locationId: number) {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/menu-categories?location_id=${locationId}`,
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
    console.error("Error fetching menu categories:", error);
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
          "All Items",
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
      <RestaurantHeader restaurant={restaurant} />
      <RestaurantInfo restaurant={restaurant} />
      <RestaurantMenu restaurant={restaurant} />
    </div>
  );
}
