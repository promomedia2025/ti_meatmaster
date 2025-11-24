"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import MenuSection from "./menu-section";
import MenuCategory from "./menu-category";
import { MenuOptionsModal } from "./menu-options-modal";
import { useServerCart } from "@/lib/server-cart-context";
import { useAuth } from "@/lib/auth-context";
import { useLocationFromUrl } from "@/lib/use-location-from-url";
import { getRestaurantStatusDisplay } from "@/lib/restaurant-status";
import { useCartSidebar } from "@/lib/cart-sidebar-context";

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
  image?: {
    url: string;
    path: string;
    name: string;
    size: number | null;
    type: string;
    width: number | null;
    height: number | null;
  };
  menu_options?: Array<{
    menu_option_id: number;
    option_id: number;
    option_name: string;
    display_type: string;
    priority: number;
    required: boolean;
    min_selected: number;
    max_selected: number;
    option_values: Array<{
      menu_option_value_id: number;
      option_value_id: number;
      name: string;
      price: number;
      quantity: number | null;
      is_default: boolean | null;
      priority: number;
    }>;
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
  const {
    globalSummary,
    addItem,
    isLoading: cartLoading,
    getLocationCart,
  } = useServerCart();
  const { isAuthenticated } = useAuth();
  const { locationId } = useLocationFromUrl();
  const { isCartSidebarOpen, setIsCartSidebarOpen, setCartViewLocationId } =
    useCartSidebar();
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
  const [isMenuOptionsModalOpen, setIsMenuOptionsModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );
  const [isSticky, setIsSticky] = useState(false);

  // Refs for category sections
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const navigationRef = useRef<HTMLDivElement>(null);

  // Handle sticky position detection using scroll
  useEffect(() => {
    const handleScroll = () => {
      const navigationElement = navigationRef.current;
      if (!navigationElement) return;

      const rect = navigationElement.getBoundingClientRect();
      const isCurrentlySticky = rect.top <= 84; // 84px is the sticky top position
      setIsSticky(isCurrentlySticky);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryChange = (category: string) => {
    // Scroll to just before the category section to show the title
    setTimeout(() => {
      const categoryElement = categoryRefs.current[category];
      if (categoryElement) {
        // Get the element's position and scroll to just before it
        const elementRect = categoryElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset + elementRect.top - 140; // 20px offset to show title

        window.scrollTo({
          top: scrollTop,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const handleMenuItemClick = (item: MenuItem) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      return; // Do nothing if not authenticated
    }

    setSelectedMenuItem(item);
    setIsMenuOptionsModalOpen(true);
  };

  const handleAddToCart = async (
    item: MenuItem,
    optionValues: any[],
    quantity: number,
    comment: string
  ) => {
    setLoadingItemId(item.menu_id);
    try {
      // Get restaurant status display
      const restaurantStatus = getRestaurantStatusDisplay(
        restaurant.restaurant_status
          ? {
              ...restaurant.restaurant_status,
              next_opening_time:
                restaurant.restaurant_status.next_opening_time || null,
            }
          : undefined,
        true, // fallback isOpen
        true, // fallback deliveryAvailable
        true // fallback pickupAvailable
      );

      const success = await addItem(
        item.menu_id,
        quantity,
        optionValues,
        comment,
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
    <div className="bg-black relative">
      {/* Menu Navigation */}
      <div
        ref={navigationRef}
        className={`sticky top-[75px] border-b border-gray-800 z-20 shadow-lg transition-colors duration-200 ${
          isSticky ? "bg-[#242424]" : "bg-black"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-6 min-w-max">
              {restaurant.categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className="flex items-center text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="px-4 py-6 pb-24 md:pb-6 w-full">
        {/* Authentication Banner */}
        {!isAuthenticated && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-200 text-center font-medium">
              Παρακαλώ συνδεθείτε για να προσθέτε αντικείμενα στο καλάθι σας
            </p>
          </div>
        )}

        {restaurant.menuData?.data?.menu_items ? (
          <div key="menu-items-container">
            {/* Get all unique categories from menu items */}
            {(() => {
              const allCategories = new Set<string>();
              restaurant.menuData.data.menu_items.forEach((item) => {
                item.categories.forEach((category) => {
                  allCategories.add(category.name);
                });
              });

              // Sort categories alphabetically
              const sortedCategories = Array.from(allCategories).sort();

              return sortedCategories.map((categoryName) => (
                <MenuCategory
                  key={`category-${categoryName}`}
                  categoryName={categoryName}
                  menuItems={restaurant.menuData?.data?.menu_items || []}
                  onMenuItemClick={handleMenuItemClick}
                  loadingItemId={loadingItemId}
                  isAuthenticated={isAuthenticated}
                  categoryRef={(el) => {
                    categoryRefs.current[categoryName] = el;
                  }}
                />
              ));
            })()}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No menu items available</p>
          </div>
        )}
      </div>

      {/* Menu Options Modal */}
      <MenuOptionsModal
        isOpen={isMenuOptionsModalOpen}
        onClose={() => {
          setIsMenuOptionsModalOpen(false);
          setSelectedMenuItem(null);
        }}
        menuItem={selectedMenuItem}
        onAddToCart={handleAddToCart}
      />

      {/* Mobile Floating Cart Button */}
      <div
        className={`fixed bottom-5 left-4 right-4 z-50 md:hidden transition-transform duration-500 ease-in-out ${
          isCartSidebarOpen || isMenuOptionsModalOpen
            ? "bottom-[-60px] translate-y-full"
            : "translate-y-0"
        }`}
      >
        <button
          onClick={() => {
            setCartViewLocationId(locationId || undefined);
            setIsCartSidebarOpen(true);
          }}
          className="w-full bg-[#ff9328ff] hover:bg-[#915316] text-white font-medium py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-between shadow-2xl shadow-blue-500/25 backdrop-blur-sm"
        >
          {(() => {
            const cart = getLocationCart(locationId || 0);
            return cart?.summary.count && cart.summary.count > 0;
          })() && (
            <span className="bg-white text-[#ff9328ff] text-sm font-bold px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center">
              {getLocationCart(locationId || 0)?.summary.count}
            </span>
          )}
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5" />
            <span>Δες την παραγγελία σου</span>
          </div>
          {(() => {
            const cart = getLocationCart(locationId || 0);
            return cart?.summary.total && cart.summary.total > 0;
          })() && (
            <div className="text-right">
              <div className="text-lg font-bold">
                €{getLocationCart(locationId || 0)?.summary.total.toFixed(2)}
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
