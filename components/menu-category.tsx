"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import Image from "next/image";

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

interface MenuCategoryProps {
  categoryName: string;
  menuItems: MenuItem[];
  onMenuItemClick: (item: MenuItem) => void;
  loadingItemId: number | null;
  isAuthenticated: boolean;
  categoryRef?: (el: HTMLDivElement | null) => void;
}

export default function MenuCategory({
  categoryName,
  menuItems,
  onMenuItemClick,
  loadingItemId,
  isAuthenticated,
  categoryRef,
}: MenuCategoryProps) {
  // Filter items that belong to this category
  const categoryItems = menuItems.filter((item) =>
    item.categories.some((category) => category.name === categoryName)
  );

  // If no items in this category, don't render anything
  if (categoryItems.length === 0) {
    return null;
  }

  return (
    <div ref={categoryRef} className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4">{categoryName}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 lg:gap-12">
        {categoryItems.map((item) => (
          <div
            key={item.menu_id}
            onClick={() => onMenuItemClick(item)}
            className="bg-transparent sm:bg-gray-900 rounded-lg overflow-hidden border-0 sm:border border-gray-800 border-b border-gray-700 sm:border-b-0 flex pb-4 sm:pb-0 transition-transform duration-200 hover:scale-105 cursor-pointer"
          >
            {/* Left side - Text content (60-70% width) */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-white font-medium mb-2 text-lg">
                  {item.menu_name}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {item.menu_description || ""}
                </p>
              </div>
              <div className="mt-3">
                <p className="text-blue-400 font-bold text-lg">
                  {item.menu_price.toFixed(2)} {item.currency}
                </p>
                {item.minimum_qty > 1 && (
                  <p className="text-gray-500 text-sm mt-1">
                    Min: {item.minimum_qty}
                  </p>
                )}
              </div>
            </div>

            {/* Right side - Image and Add button (30-40% width) */}
            <div className="relative w-32 h-32 flex-shrink-0 p-2.5">
              <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center relative overflow-hidden">
                {item.image?.url ? (
                  <Image
                    src={item.image.url}
                    alt={item.menu_name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">No Image</span>
                )}
              </div>

              {/* Add button positioned at top-right corner of image */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuItemClick(item);
                }}
                disabled={loadingItemId === item.menu_id || !isAuthenticated}
                className="absolute top-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-2 border-gray-900"
              >
                {loadingItemId === item.menu_id ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
