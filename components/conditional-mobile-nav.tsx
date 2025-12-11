"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { MobileBottomNav } from "./mobile-bottom-nav";

export function ConditionalMobileNav() {
  const pathname = usePathname();

  // Hide mobile bottom nav on restaurant pages
  const isRestaurantPage = pathname.startsWith("/restaurant/");

  console.log("🔍 ConditionalMobileNav:", {
    pathname,
    isRestaurantPage,
    shouldShow: !isRestaurantPage,
  });

  // Update body padding based on whether we're on a restaurant page
  useEffect(() => {
    const body = document.body;
    if (isRestaurantPage) {
      body.classList.remove("pb-16");
      console.log("🚫 Removed pb-16 from body (restaurant page)");
    } else {
      body.classList.add("pb-16");
      console.log("✅ Added pb-16 to body (other page)");
    }

    // Cleanup function
    return () => {
      // Don't remove pb-16 on cleanup as it might be needed for other pages
    };
  }, [isRestaurantPage]);

  if (isRestaurantPage) {
    console.log("🚫 Hiding mobile bottom nav on restaurant page");
    return null;
  }

  console.log("✅ Showing mobile bottom nav");
  return <MobileBottomNav />;
}
