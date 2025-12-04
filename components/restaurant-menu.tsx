"use client";

import AutoSelect from "@/components/AutoSelect";
import { useState, useEffect, useRef } from "react";
import MenuCategory from "./menu-category";
import { MenuOptionsModal } from "./menu-options-modal";
import { useServerCart } from "@/lib/server-cart-context";
import { useAuth } from "@/lib/auth-context";
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
  };
}

interface Restaurant {
  id: string;
  name: string;
  categories: string[];
  menuData?: MenuData | null;
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
  const { addItem } = useServerCart();
  const { isAuthenticated } = useAuth();

  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
  const [isMenuOptionsModalOpen, setIsMenuOptionsModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const [isSticky, setIsSticky] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const navigationRef = useRef<HTMLDivElement>(null);

  /** Sticky Logic */
  useEffect(() => {
    const handleScrollSticky = () => {
      const el = navigationRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      setIsSticky(rect.top <= 84);
    };

    handleScrollSticky();
    window.addEventListener("scroll", handleScrollSticky);
    return () => window.removeEventListener("scroll", handleScrollSticky);
  }, []);

  /** Scroll Spy */
  useEffect(() => {
    const offset = 120;

    const spy = () => {
      let closest: { name: string; distance: number } | null = null;

      for (const [name, el] of Object.entries(categoryRefs.current)) {
        if (!el) continue;

        const dist = Math.abs(el.getBoundingClientRect().top - offset);
        if (!closest || dist < closest.distance) {
          closest = { name, distance: dist };
        }
      }

      if (closest && closest.name !== activeCategory) {
        setActiveCategory(closest.name);
      }
    };

    spy();
    window.addEventListener("scroll", spy);
    return () => window.removeEventListener("scroll", spy);
  }, [activeCategory]);

  /** Scroll Spy Horizontal Sync */
  useEffect(() => {
    if (!navigationRef.current || !activeCategory) return;

    const container = navigationRef.current.querySelector(
      ".category-scroll-container"
    ) as HTMLElement | null;

    if (!container) return;

    const activeBtn = container.querySelector(
      `[data-category="${activeCategory}"]`
    ) as HTMLElement | null;

    if (!activeBtn) return;

    const btnLeft = activeBtn.offsetLeft;
    const btnRight = btnLeft + activeBtn.offsetWidth;

    const viewLeft = container.scrollLeft;
    const viewRight = viewLeft + container.clientWidth;

    // Scroll only when out of view
    if (btnLeft < viewLeft || btnRight > viewRight) {
      container.scrollTo({
        left:
          btnLeft -
          container.clientWidth / 2 +
          activeBtn.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeCategory]);

  /** Scroll to category on click */
  const handleCategoryChange = (category: string) => {
    const el = categoryRefs.current[category];
    if (!el) return;

    const top =
      window.pageYOffset +
      el.getBoundingClientRect().top -
      120;

    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleMenuItemClick = (item: MenuItem) => {
    if (!isAuthenticated) return;
    setSelectedMenuItem(item);
    setIsMenuOptionsModalOpen(true);
  };

  const handleAddToCart = async (
    item: MenuItem,
    optionValues: any[],
    qty: number,
    comment: string
  ) => {
    setLoadingItemId(item.menu_id);
    try {
      const status = getRestaurantStatusDisplay(
        restaurant.restaurant_status
          ? { ...restaurant.restaurant_status }
          : undefined,
        true,
        true,
        true
      );

      await addItem(
        item.menu_id,
        qty,
        optionValues,
        comment,
        { name: item.menu_name, price: item.menu_price },
        status
      );
    } finally {
      setLoadingItemId(null);
    }
  };

  /** Construct category list */
  const items = restaurant.menuData?.data.menu_items || [];

  const categories = (() => {
    const map = new Map<string, number>();

    items.forEach((item) =>
      item.categories.forEach((c) => {
        if (!map.has(c.name)) map.set(c.name, c.priority);
      })
    );

    return [...map.entries()]
      .map(([name, priority]) => ({ name, priority }))
      .sort((a, b) => a.priority - b.priority);
  })();

  return (
    <div className="bg-black w-full relative">

      {/* Sticky Full-Width Category Nav */}
      <div
        ref={navigationRef}
        className={`sticky top-[75px] w-full z-30 border-b border-gray-800 shadow-lg transition-colors ${
          isSticky ? "bg-[#242424]" : "bg-black"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 pt-4 pb-2">
          <div className="category-scroll-container flex-1 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-6 min-w-max">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  data-category={cat.name}
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`
                    flex items-center text-sm font-medium whitespace-nowrap border-b-2
                    transition-colors
                    ${
                      activeCategory === cat.name
                        ? "text-white border-[#ff9328ff]"
                        : "text-gray-400 border-transparent hover:text-gray-300"
                    }
                  `}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Centered Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-6 pb-24 md:pb-6">
        {!isAuthenticated && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-200 text-center font-medium">
              Παρακαλώ συνδεθείτε για να προσθέτε αντικείμενα στο καλάθι σας
            </p>
          </div>
        )}

        {items.length ? (
          categories.map((cat) => (
            <MenuCategory
              key={`category-${cat.name}`}
              categoryName={cat.name}
              menuItems={items}
              onMenuItemClick={handleMenuItemClick}
              loadingItemId={loadingItemId}
              isAuthenticated={isAuthenticated}
              categoryRef={(el) => (categoryRefs.current[cat.name] = el)}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            No menu items available
          </div>
        )}
      </div>

      {/* Modal */}
      <MenuOptionsModal
        isOpen={isMenuOptionsModalOpen}
        onClose={() => {
          setIsMenuOptionsModalOpen(false);
          setSelectedMenuItem(null);
        }}
        menuItem={selectedMenuItem}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
