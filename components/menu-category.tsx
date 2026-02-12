"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

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
    is_enabled?: boolean;
    available?: boolean;
    free_count: number;
    free_order_by: "selection_order" | "lowest_price" | "priority";
    option_values: Array<{
      menu_option_value_id: number;
      option_value_id: number;
      name: string;
      price: number;
      quantity: number | null;
      is_default: boolean | null;
      priority: number;
      is_enabled?: boolean;
      available?: boolean;
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
      {/* Category Header with Orange Accent Border */}
      <h2 className="text-xl font-bold text-white mb-4 pl-2 border-l-4 border-[var(--brand-border)]">
        {categoryName}
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 lg:gap-12">
        {categoryItems.map((item) => (
          <div
            key={item.menu_id}
            id={String(item.menu_id)}
            onClick={() => onMenuItemClick(item)}
            className="bg-transparent sm:bg-zinc-900 rounded-xl overflow-hidden border-0 sm:border border-zinc-800 border-b border-zinc-800/50 sm:border-b-zinc-800 flex pb-4 sm:pb-0 transition-all duration-200 hover:scale-[1.02] hover:border-[var(--brand-border)]/50 hover:shadow-[0_0_20px_rgba(255,147,40,0.15)] cursor-pointer group"
          >
            {/* Left side - Text content */}
            <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
              <div className="flex flex-col h-full">
                <h3 className="text-white font-bold mb-2 text-lg group-hover:text-[var(--brand-border)] transition-colors truncate">
                  {item.menu_name}
                </h3>
                
                {/* Description with constraints */}
                <div className="flex-1 min-h-[40px] max-w-full">
                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 w-full break-words">
                    {item.menu_description || ""}
                    </p>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-white font-bold text-lg">
                  {item.menu_price.toFixed(2)} {item.currency}
                </p>
                {item.minimum_qty > 1 && (
                  <p className="text-zinc-500 text-sm mt-1">
                    Min: {item.minimum_qty}
                  </p>
                )}
              </div>
            </div>

            {/* Right side - Image and Add button */}
            <div className="relative w-32 h-32 flex-shrink-0 p-2.5">
              <div className="w-full h-full rounded-lg flex items-center justify-center relative overflow-hidden bg-transparent">
                {item.image?.url ? (
                  <Image
                    src={item.image.url}
                    alt={item.menu_name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="180px"
                  />
                ) : (
                  <div className="h-full w-full bg-transparent" />
                )}
              </div>

              {/* Add button - Orange Brand Color */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuItemClick(item);
                }}
                disabled={loadingItemId === item.menu_id || !isAuthenticated}
                className="absolute top-0 right-0 w-10 h-10 bg-[var(--brand-border)] rounded-full flex items-center justify-center hover:bg-[var(--brand-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-2 border-black hover:scale-110 active:scale-95 z-10"
              >
                {loadingItemId === item.menu_id ? (
                  <Skeleton className="w-5 h-5 rounded-full bg-white/20" />
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