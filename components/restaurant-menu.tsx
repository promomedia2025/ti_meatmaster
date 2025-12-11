"use client";

import AutoSelect from "@/components/AutoSelect";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart } from "lucide-react";
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
  menu_options?: any[];
  image?: any;
}

interface MenuData {
  data: {
    location: { id: number; name: string };
    menu_items: MenuItem[];
  };
}

interface Restaurant {
  id: string;
  name: string;
  categories: string[];
  menuData?: MenuData | null;
  restaurant_status?: any;
}

interface RestaurantMenuProps {
  restaurant: Restaurant;
}

export default function RestaurantMenu({ restaurant }: RestaurantMenuProps) {
  const { addItem, getLocationCart } = useServerCart();
  const { isAuthenticated } = useAuth();
  const { locationId } = useLocationFromUrl();
  const { isCartSidebarOpen, setIsCartSidebarOpen, setCartViewLocationId } =
    useCartSidebar();

  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
  const [isMenuOptionsModalOpen, setIsMenuOptionsModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const [isSticky, setIsSticky] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  /** refs */
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const navigationRef = useRef<HTMLDivElement>(null);

  /** Sticky nav toggle */
  useEffect(() => {
    const handleScroll = () => {
      const el = navigationRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setIsSticky(rect.top <= 84);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /** Scroll spy for vertical movement */
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

  /** Scroll spy → horizontal nav auto-scroll */
  useEffect(() => {
    if (!activeCategory || !navigationRef.current) return;

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

    // only scroll if outside view
    if (btnLeft < viewLeft || btnRight > viewRight) {
      container.scrollTo({
        left: btnLeft - container.clientWidth / 2 + activeBtn.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeCategory]);

  const handleCategoryChange = (category: string) => {
    setTimeout(() => {
      const el = categoryRefs.current[category];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const offset = window.pageYOffset + rect.top - 140;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }, 100);
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

  const items = restaurant.menuData?.data.menu_items || [];

  /** Unique categories sorted by priority */
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
    <div className="bg-black relative w-full">

      <AutoSelect />

      {/* Sticky Nav */}
      <div
        ref={navigationRef}
        className={`sticky top-[75px] w-full border-b border-gray-800 z-30 shadow-lg transition-colors duration-200 ${
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
                        ? "text-white border-[#9E2E29]"
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

      {/* CONTENT */}
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

      {/* MODAL */}
      <MenuOptionsModal
        isOpen={isMenuOptionsModalOpen}
        onClose={() => {
          setIsMenuOptionsModalOpen(false);
          setSelectedMenuItem(null);
        }}
        menuItem={selectedMenuItem}
        onAddToCart={handleAddToCart}
      />

      {/* Floating Cart Button */}
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
          className="w-full bg-[#9E2E29] hover:bg-[#601B19] text-white font-medium py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-between shadow-2xl shadow-blue-500/25 backdrop-blur-sm"
        >
          {(() => {
            const cart = getLocationCart(locationId || 0);
            return cart?.summary.count && cart.summary.count > 0;
          })() && (
            <span className="bg-white text-[#9E2E29] text-sm font-bold px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center">
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
