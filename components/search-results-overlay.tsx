"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface SearchTag {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
  email: string;
  telephone: string;
  address: {
    line_1: string;
    line_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    country_id: number;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description: string;
  status: boolean;
  permalink: string;
  options: any;
  images: {
    thumbnail: {
      url: string;
      path: string;
      name: string;
      size: number | null;
      type: string;
      width: number | null;
      height: number | null;
    };
  };
  restaurant_status: {
    is_open: boolean;
    pickup_available: boolean;
    delivery_available: boolean;
    next_opening_time: string | null;
    status_message: string;
  };
  search_tags: SearchTag[];
}

interface SearchResultsData {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    locations: Location[];
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

interface SearchResultsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  selectedTags: number[];
}

export function SearchResultsOverlay({
  isOpen,
  onClose,
  searchQuery,
  selectedTags,
}: SearchResultsOverlayProps) {
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch search results
  useEffect(() => {
    if (!isOpen || (!searchQuery && selectedTags.length === 0)) {
      setResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams();

        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        if (selectedTags.length > 0) {
          params.append("tags", selectedTags.join(","));
        }

        const response = await fetch(`/api/locations?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data: SearchResultsData = await response.json();

        if (data.success) {
          setResults(data.data.locations);
        } else {
          setError(data.message || "Search failed");
        }
      } catch (err) {
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [isOpen, searchQuery, selectedTags]);

  // Helper function to generate a slug from the restaurant name (same as restaurant-grid.tsx)
  const generateSlug = (name: string, id: number) => {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim() + `-${id}`
    );
  };

  const handleLocationClick = (location: Location) => {
    // Create URL in format: location-name-id
    const locationSlug = generateSlug(location.name, location.id);

    // Navigate to location page
    router.push(`/location/${locationSlug}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="w-full border border-border border-t-0 rounded-t-none rounded-b-lg shadow-lg max-h-[60vh] sm:max-h-[70vh] overflow-hidden relative z-[60]"
      style={{ backgroundColor: "#242424" }}
      data-search-results
    >
      {/* Content */}
      <div className="overflow-y-auto max-h-[60vh] sm:max-h-[70vh]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-destructive">{error}</div>
        ) : results.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery || selectedTags.length > 0
              ? "No results found"
              : "Start typing to search..."}
          </div>
        ) : (
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 max-w-[1600px] w-full mx-auto">
              {results.map((location) => (
                <div
                  key={location.id}
                  onClick={() => handleLocationClick(location)}
                  className="flex flex-col bg-background hover:border-primary/50 cursor-pointer transition-all duration-200 hover:shadow-lg rounded-lg overflow-hidden border border-border group"
                >
                  {/* Image Container */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    {location.images?.thumbnail?.url ? (
                      <Image
                        src={location.images.thumbnail.url}
                        alt={location.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">

                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
                    <h3
                      className="font-medium text-foreground text-sm sm:text-base mb-1 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {location.name}
                    </h3>
                    <p
                      className="text-xs sm:text-sm text-muted-foreground mb-2 flex-1 overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {location.address.line_1}, {location.address.city}
                    </p>

                    {/* Status and Tags */}
                    <div className="space-y-2">
                      {/* Status Badge */}
                      <div className="flex items-center">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            location.restaurant_status.is_open
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {location.restaurant_status.is_open
                            ? "Open"
                            : "Closed"}
                        </span>
                      </div>

                      {/* Tags */}
                      {location.search_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {location.search_tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag.id}
                              className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {location.search_tags.length > 2 && (
                            <span className="text-xs text-muted-foreground px-1">
                              +{location.search_tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
