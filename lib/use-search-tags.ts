"use client";

import { useState, useEffect } from "react";

interface SearchTag {
  id: number;
  name: string;
}

interface SearchTagsResponse {
  success: boolean;
  data: SearchTag[];
  message?: string;
}

const CACHE_KEY = "search_tags_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedData {
  data: SearchTag[];
  timestamp: number;
}

export function useSearchTags() {
  const [tags, setTags] = useState<SearchTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        // Check if we have cached data
        const cachedData = getCachedTags();

        if (cachedData) {
          setTags(cachedData);
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/search-tags");

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const result = await response.json();

        // Handle both response structures: direct array or wrapped in success/data
        let allTags: SearchTag[] = [];
        if (Array.isArray(result)) {
          // If response is directly an array
          allTags = result;
        } else if (
          result.success &&
          result.data &&
          Array.isArray(result.data)
        ) {
          // If response is wrapped in success/data structure
          allTags = result.data;
        } else if (result.data && Array.isArray(result.data)) {
          // If response has data property with array
          allTags = result.data;
        } else {
          throw new Error("Invalid response structure from search tags API");
        }

        // Cache the data
        cacheTags(allTags);

        setTags(allTags);
      } catch (err) {
        console.error("Error fetching search tags:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch search tags"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, isLoading, error };
}

function getCachedTags(): SearchTag[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsedCache: CachedData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - parsedCache.timestamp > CACHE_DURATION) {
      console.log("📋 Search tags cache expired, removing");
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsedCache.data;
  } catch (error) {
    console.error("Error reading search tags cache:", error);
    // Remove corrupted cache
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function cacheTags(tags: SearchTag[]): void {
  try {
    const cacheData: CachedData = {
      data: tags,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log("📋 Search tags cached successfully");
  } catch (error) {
    console.error("Error caching search tags:", error);
  }
}

// Function to manually clear the cache (useful for development or when you want to force refresh)
export function clearSearchTagsCache(): void {
  localStorage.removeItem(CACHE_KEY);
  console.log("📋 Search tags cache cleared");
}
