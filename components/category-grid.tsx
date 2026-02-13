"use client";

import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchTags } from "@/lib/use-search-tags";

import image1 from "@/public/categories/1.png";
import image2 from "@/public/categories/2.png";
import image3 from "@/public/categories/3.png";
import image4 from "@/public/categories/4.png";
import image5 from "@/public/categories/5.png";
import image6 from "@/public/categories/6.png";
import image7 from "@/public/categories/7.png";
import image8 from "@/public/categories/8.png";
import image9 from "@/public/categories/9.png";
import image10 from "@/public/categories/10.png";
import image11 from "@/public/categories/11.png";
import image12 from "@/public/categories/12.png";
import image13 from "@/public/categories/13.png";
import image14 from "@/public/categories/14.png";
import image15 from "@/public/categories/15.png";
import image16 from "@/public/categories/16.png";
import image17 from "@/public/categories/17.png";

interface Category {
  id: number;
  name: string;
  image: string;
}

/* 🔥 ONE LINK FOR ALL CATEGORIES */
const CATEGORY_LINK = "/location/Perfetta-1";

const categoryImageMap: Record<string, any> = {
  Τυλιχτά: image1,
  Μαγειρευτά: image2,
  Κοτόπουλα: image5,
  Σαλάτες: image14,
  "Burgers XXL": image11,
  Μερίδες: image9,
  Αναψυκτικά: image17,
  Χορτοφαγική: image3,
  Γλυκά: image16,
  Αλοιφές: image4,
  Ορεκτικά: image15,
  Πατάτες: image12,
  Ποικιλίες: image10,
  Τεμάχια: image6,
  "Σκεπαστές κλασικές": image7,
  "Σκεπαστές XXL": image8,
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

      {/* Desktop header */}
      {hasMoreItems && (
        <div className="hidden lg:flex justify-between mt-6">
          <h1 className="text-2xl font-bold">Παράγγειλε σε 1΄</h1>
          <button
            onClick={toggleExpanded}
            className="px-6 py-3 border rounded-full"
          >
            {isExpanded ? "Λιγότερα" : "Περισσότερα"}
          </button>
        </div>
      )}

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
