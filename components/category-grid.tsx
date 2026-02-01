"use client";

import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  count?: string;
  image: string;
}

// Map category names to images
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
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tags, isLoading, error } = useSearchTags();

  // Load selected tags from URL params on mount
  useEffect(() => {
    const tagsParam = searchParams.get("tags");
    if (tagsParam) {
      const tags = tagsParam.split(",").map(Number).filter(Boolean);
      setSelectedTags(tags);
    }
  }, [searchParams]);

  // Format tags as categories when they're loaded
  useEffect(() => {
    if (tags && tags.length > 0) {
      const formattedCategories = tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        image: categoryImageMap[tag.name] || "/placeholder.jpg",
      }));
      setCategories(formattedCategories);
    }
  }, [tags]);

  // Handle category click to toggle tag selection
  const handleCategoryClick = (tagId: number) => {
    let newSelectedTags: number[];

    if (selectedTags.includes(tagId)) {
      // Remove tag if already selected
      newSelectedTags = selectedTags.filter((id) => id !== tagId);
    } else {
      // Add tag if not selected
      newSelectedTags = [...selectedTags, tagId];
    }

    setSelectedTags(newSelectedTags);

    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    if (newSelectedTags.length > 0) {
      params.set("tags", newSelectedTags.join(","));
    } else {
      params.delete("tags");
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Calculate items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(8); // lg: 8 items (more compact)
      } else if (window.innerWidth >= 768) {
        setItemsPerView(3); // md: 3 items
      } else {
        setItemsPerView(2); // sm: 2 items
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const hasMoreItems = categories.length > itemsPerView;
  const [isAnimating, setIsAnimating] = useState(false);
  const visibleCategories =
    isExpanded || isAnimating ? categories : categories.slice(0, itemsPerView);

  const toggleExpanded = () => {
    if (isExpanded) {
      // When closing, start animation first
      setIsAnimating(true);
      setIsExpanded(false);
      // Hide items after animation completes
      setTimeout(() => setIsAnimating(false), 500);
    } else {
      // When opening, just expand
      setIsExpanded(true);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Κατηγορίες</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Φόρτωση κατηγοριών...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Κατηγορίες</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Σφάλμα φόρτωσης κατηγοριών
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 flex flex-col gap-4">
      {/* Mobile/Tablet: Horizontal scrollable carousel */}
      <div className="lg:hidden overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pb-4">
          {categories.map((category) => {
            const isSelected = selectedTags.includes(category.id);
            return (
              <div
                key={category.id}
                className="flex-shrink-0 w-[45%] sm:w-[30%]"
              >
                <Card
                  onClick={() => handleCategoryClick(category.id)}
                  className={`group cursor-pointer overflow-hidden bg-card hover:scale-105 transition-all duration-200 ${
                    isSelected
                      ? "border-2 border-primary ring-2 ring-primary/20"
                      : "border-border"
                  }`}
                >
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      priority={category.id <= 6}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-semibold text-sm">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {hasMoreItems && (
        <div className="hidden lg:flex justify-between mt-6">
          <h1 className="text-2xl font-bold text-foreground hidden lg:block">
            Παράγγειλε σε 1΄
          </h1>
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground bg-card hover:bg-card/80 border border-border rounded-full transition-colors"
          >
            <span>{isExpanded ? "Λιγότερα" : "Περισσοτέρα"}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      )}
      {/* Desktop: Grid with accordion */}
      <div className="hidden lg:block p-2">
        <div
          className="grid grid-cols-8 gap-3 overflow-hidden transition-all duration-500 ease-in-out"
          style={{
            maxHeight: isExpanded
              ? `${Math.ceil(categories.length / 8) * 180}px`
              : "170px",
          }}
        >
          {visibleCategories.map((category) => {
            const isSelected = selectedTags.includes(category.id);
            return (
              <Card
                key={category.id}
                className={`group cursor-pointer overflow-hidden bg-card hover:scale-105 transition-all duration-200 ${
                  isSelected
                    ? "border-2 border-primary ring-2 ring-primary/20"
                    : "border-border"
                }`}
              >
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    priority={category.id <= 8}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 bg-primary text-white rounded-full p-0.5">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-white font-semibold text-xs">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Show more/less button - Desktop only */}
      </div>
    </div>
  );
}
