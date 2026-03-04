"use client";

import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchTags } from "@/lib/use-search-tags";
import { WalletWidget } from "@/components/wallet-widget"; // <-- Imported Wallet Widget

import image1 from "@/public/categories/classic_ham.png";
import image2 from "@/public/categories/club_sand.png";
import image3 from "@/public/categories/kids_menu.png";
import image4 from "@/public/categories/spaghetti.png";
import image5 from "@/public/categories/italian_pizza.png";
import image6 from "@/public/categories/s_pizza.png";
import image7 from "@/public/categories/soft_drinks.png";
import image8 from "@/public/categories/pannacotta.png";
import image9 from "@/public/categories/mix_grill.png";
import image10 from "@/public/categories/beers.png";
import image11 from "@/public/categories/garlic_bread.png";
import image12 from "@/public/categories/stick_fried.png";
import image13 from "@/public/categories/pern_ground_beef.png";
import image14 from "@/public/categories/rissoto_white.png";
import image15 from "@/public/categories/ceasars_salad.png";
import image16 from "@/public/categories/sk_cheese_tom.png";

interface Category {
  id: number;
  name: string;
  image: string;
}

/* 🔥 ONE LINK FOR ALL CATEGORIES */
const CATEGORY_LINK = "/location/Perfetta-1";

const categoryImageMap: Record<string, any> = {
  Burger: image1,
  "Club sandwich": image2,
  "Kids menu": image3,
  Pasta: image4,
  Pizza: image5,
  "Sweet pizza": image6,
  Αναψυκτικά: image7,
  Γλυκά: image8,
  "Μερίδες κρεατικών": image9,
  "Μπύρες - Ποτά": image10,
  Ορεκτικά: image11,
  Πατάτες: image12,
  "Πεϊνιρλί": image13,
  Ριζότο: image14,
  Σαλάτες: image15,
  Σκεπαστές: image16,
};

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemsPerView, setItemsPerView] = useState(6);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { tags, isLoading, error } = useSearchTags();

  useEffect(() => {
    if (tags?.length) {
      setCategories(
        tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          image: categoryImageMap[tag.name] || "/placeholder.svg",
        }))
      );
    }
  }, [tags]);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setItemsPerView(8);
      else if (window.innerWidth >= 768) setItemsPerView(3);
      else setItemsPerView(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const hasMoreItems = categories.length > itemsPerView;
  const visibleCategories =
    isExpanded || isAnimating ? categories : categories.slice(0, itemsPerView);

  const toggleExpanded = () => {
    if (isExpanded) {
      setIsAnimating(true);
      setIsExpanded(false);
      setTimeout(() => setIsAnimating(false), 500);
    } else {
      setIsExpanded(true);
    }
  };

  if (isLoading || error) {
    return (
      <div className="mb-8 text-center py-8 text-muted-foreground">
        {isLoading ? "Φόρτωση κατηγοριών..." : "Σφάλμα φόρτωσης κατηγοριών"}
      </div>
    );
  }

  return (
    <div className="mb-8 flex flex-col gap-4">
      {/* Mobile / Tablet */}
      <div className="lg:hidden overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pb-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={CATEGORY_LINK}
              className="flex-shrink-0 w-[45%] sm:w-[30%]"
            >
              <Card className="group cursor-pointer overflow-hidden bg-card border-border hover:scale-105 transition-all duration-200">
                <div className="aspect-[4/3] relative">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-semibold text-sm">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop header with Wallet Widget */}
      <div className="hidden lg:flex items-center justify-between mt-6 mb-2">
        {/* Left side: Fixed width to keep middle centered */}
        <div className="w-48">
          <h1 className="text-2xl font-bold">Παράγγειλε σε 1΄</h1>
        </div>

        {/* Middle: Centered Wallet Widget */}
        <div className="flex-1 flex justify-center">
          <WalletWidget variant="desktop" />
        </div>

        {/* Right side: Fixed width to keep middle centered */}
        <div className="w-48 flex justify-end">
          {hasMoreItems && (
            <button
              onClick={toggleExpanded}
              className="px-6 py-2 border rounded-full text-sm hover:bg-white/5 transition-colors"
            >
              {isExpanded ? "Λιγότερα" : "Περισσότερα"}
            </button>
          )}
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden lg:block p-2">
        <div
          className="grid grid-cols-8 gap-3 overflow-hidden transition-all duration-500"
          style={{
            maxHeight: isExpanded
              ? `${Math.ceil(categories.length / 8) * 180}px`
              : "170px",
          }}
        >
          {visibleCategories.map((category) => (
            <Link key={category.id} href={CATEGORY_LINK}>
              <Card className="group cursor-pointer overflow-hidden bg-card border-border hover:scale-105 transition-all duration-200">
                <div className="aspect-square relative">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-white font-semibold text-xs">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}