"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onFavorite: () => Promise<{ success: boolean; error?: string }>;
  onUnfavorite: () => Promise<{ success: boolean; error?: string }>;
}

export default function FavoriteButton({
  isFavorite,
  onFavorite,
  onUnfavorite,
}: FavoriteButtonProps) {
  const [favoriteStatus, setFavoriteStatus] = useState<boolean>(isFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFavorite = async () => {
    if (isLoading) {
      console.log("❤️ [CLIENT] Button click ignored - already loading");
      return;
    }

    console.log("❤️ [CLIENT] Favorite button clicked");
    console.log("❤️ [CLIENT] Current favorite status:", favoriteStatus);

    setIsLoading(true);

    // Optimistically update the UI
    const previousStatus = favoriteStatus;
    const newStatus = !favoriteStatus;
    console.log("❤️ [CLIENT] Optimistically updating status to:", newStatus);
    setFavoriteStatus(newStatus);

    try {
      // Call the appropriate server action
      const actionName = newStatus ? "onFavorite" : "onUnfavorite";
      console.log(`❤️ [CLIENT] Calling ${actionName}...`);

      const startTime = Date.now();
      const result = newStatus ? await onFavorite() : await onUnfavorite();
      const duration = Date.now() - startTime;

      console.log(`❤️ [CLIENT] ${actionName} completed in ${duration}ms`);
      console.log("❤️ [CLIENT] Result:", JSON.stringify(result, null, 2));

      if (!result.success) {
        console.error(`❤️ [CLIENT] ❌ ${actionName} failed:`, result.error);
        console.log("❤️ [CLIENT] Rolling back optimistic update");
        // Rollback the optimistic update
        setFavoriteStatus(previousStatus);

        // Check if it's an authentication error
        if (
          result.error === "AUTH_REQUIRED" ||
          result.message?.includes("Authentication")
        ) {
          const shouldReload = confirm(
            "Your session has expired. Would you like to reload the page to log in again?"
          );
          if (shouldReload) {
            window.location.reload();
          }
        } else {
          // Show error to user
          alert(
            `Failed to ${newStatus ? "favorite" : "unfavorite"}: ${
              result.message || result.error || "Unknown error"
            }`
          );
        }
      } else {
        console.log(
          "❤️ [CLIENT] ✅ Action successful, keeping optimistic update"
        );
      }
    } catch (error) {
      console.error("❤️ [CLIENT] 💥 Exception in toggleFavorite:", error);
      console.error(
        "❤️ [CLIENT] Error type:",
        error instanceof Error ? error.constructor.name : typeof error
      );
      console.error(
        "❤️ [CLIENT] Error message:",
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        "❤️ [CLIENT] Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );

      // Rollback the optimistic update
      console.log(
        "❤️ [CLIENT] Rolling back optimistic update due to exception"
      );
      setFavoriteStatus(previousStatus);

      // Show error to user
      alert(
        `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`
      );
    } finally {
      setIsLoading(false);
      console.log("❤️ [CLIENT] Loading state cleared");
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors ${
        favoriteStatus ? "text-red-500" : "text-white"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <Heart
        className={`w-5 h-5 ${favoriteStatus ? "fill-current" : ""} ${
          isLoading ? "animate-pulse" : ""
        }`}
      />
    </button>
  );
}
