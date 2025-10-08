"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingCart, Plus, Loader2 } from "lucide-react";
import MenuSection from "./menu-section";
import CartModal from "./cart-modal";
import { useCart } from "@/lib/cart-context";
import { getRestaurantStatusDisplay } from "@/lib/restaurant-status";

interface MenuItem {
  menu_id: number;
  menu_name: string;
  menu_description: string;
  menu_price: number;
  minimum_qty: number;
  menu_priority: number;
  order_restriction: string | null;
  currency: string;
  categories: Array<{
    category_id: number;
    name: string;
    description: string;
    priority: number;
    permalink_slug: string;
  }>;
}

interface MenuData {
  data: {
    location: {
      id: number;
      name: string;
    };
    menu_items: MenuItem[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
      from: number;
      to: number;
    };
  };
}

interface Restaurant {
  id: string;
  name: string;
  categories: string[];
  menuData?: MenuData | null;
  menuCategoriesData?: any;
  selectedCategory?: string;
  restaurant_status?: {
    is_open: boolean;
    pickup_available: boolean;
    delivery_available: boolean;
    status_message: string;
    next_opening_time?: string | null;
  };
}

interface RestaurantMenuProps {
  restaurant: Restaurant;
}

export default function RestaurantMenu({ restaurant }: RestaurantMenuProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { globalSummary, addItem, isLoading: cartLoading } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const activeCategory = restaurant.selectedCategory || "All Items";

  const handleCategoryChange = (category: string) => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams);
    if (category === "All Items") {
      params.delete("category");
    } else {
      // Find the category slug for the selected category
      const selectedCategoryData =
        restaurant.menuCategoriesData?.data?.categories?.find(
          (cat) => cat.name === category
        );
      const categorySlug = selectedCategoryData?.permalink_slug;
      if (categorySlug) {
        params.set("category", categorySlug);
      }
    }
    router.push(`?${params.toString()}`);
  };

  // Reset loading state when menu data changes
  useEffect(() => {
    if (restaurant.menuData) {
      setIsLoading(false);
    }
  }, [restaurant.menuData]);

  const handleAddToCart = async (item: MenuItem) => {
    setLoadingItemId(item.menu_id);
    try {
      // Get restaurant status display
      const restaurantStatus = getRestaurantStatusDisplay(
        restaurant.restaurant_status,
        true, // fallback isOpen
        true, // fallback deliveryAvailable
        true // fallback pickupAvailable
      );

      const success = await addItem(
        item.menu_id,
        1,
        [],
        "",
        {
          name: item.menu_name,
          price: item.menu_price,
        },
        restaurantStatus
      );
      if (success) {
        // Item added successfully
        console.log("Item added to cart");
      }
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div className="bg-black">
      {/* Menu Navigation */}
      <div className="sticky top-0 bg-black border-b border-gray-800 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {restaurant.categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${
                    activeCategory === category
                      ? "text-white border-blue-400"
                      : "text-gray-400 border-transparent hover:text-gray-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <div className="relative">
              <button
                onClick={() => setIsCartModalOpen(true)}
                className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Καλάθι ({globalSummary.totalItems})</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Αναζήτηση σε${restaurant.name}`}
                className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="ml-2 text-gray-400">Loading menu items...</span>
          </div>
        )}

        {!isLoading && activeCategory === "All Items" && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">All Items</h2>
            {restaurant.menuData?.data?.menu_items ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {restaurant.menuData.data.menu_items.map((item) => (
                  <div
                    key={item.menu_id}
                    className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800"
                  >
                    <div className="relative h-32 bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-white font-medium mb-1">
                            {item.menu_name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {item.menu_description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={loadingItemId === item.menu_id}
                          className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingItemId === item.menu_id ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 text-white" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-blue-400 font-bold">
                          {item.menu_price} {item.currency}
                        </p>
                        {item.minimum_qty > 1 && (
                          <p className="text-gray-500 text-sm">
                            Min: {item.minimum_qty}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No menu items available</p>
              </div>
            )}
          </div>
        )}

        {/* Render menu categories */}
        {!isLoading &&
          restaurant.menuCategoriesData?.data?.categories &&
          restaurant.menuCategoriesData.data.categories.map(
            (category: any) =>
              activeCategory === category.name && (
                <div key={category.category_id} className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-gray-400 mb-4">{category.description}</p>
                  )}
                  {restaurant.menuData?.data?.menu_items ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {restaurant.menuData.data.menu_items.map((item) => (
                        <div
                          key={item.menu_id}
                          className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800"
                        >
                          <div className="relative h-32 bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">
                              No Image
                            </span>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="text-white font-medium mb-1">
                                  {item.menu_name}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  {item.menu_description}
                                </p>
                              </div>
                              <button
                                onClick={() => handleAddToCart(item)}
                                disabled={loadingItemId === item.menu_id}
                                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loadingItemId === item.menu_id ? (
                                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                                ) : (
                                  <Plus className="w-4 h-4 text-white" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-blue-400 font-bold">
                                {item.menu_price} {item.currency}
                              </p>
                              {item.minimum_qty > 1 && (
                                <p className="text-gray-500 text-sm">
                                  Min: {item.minimum_qty}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">
                        No menu items available for this category
                      </p>
                    </div>
                  )}
                </div>
              )
          )}

        {!isLoading && activeCategory === "Popular" && (
          <MenuSection title="Popular" />
        )}
        {!isLoading && activeCategory === "Specials" && (
          <MenuSection title="Specials" />
        )}
      </div>

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
      />
    </div>
  );
}
