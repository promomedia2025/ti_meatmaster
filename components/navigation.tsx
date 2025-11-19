"use client";

import { Utensils, Store, Sparkles } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract language from pathname (e.g., /en/Discovery -> "en")
  const lang = pathname.split("/")[1] || "el";

  // Check which route is active
  const isDiscoveryActive = pathname.includes("/Discovery");
  const isRestaurantsActive = pathname.includes("/Restaurants");
  const isStoresActive = pathname.includes("/Stores");

  const navigateTo = (route: string) => {
    router.push(`/${lang}/${route}`);
  };

  return (
    <nav className="border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center md:gap-4 gap-2 py-4 overflow-x-auto">
          <button
            onClick={() => navigateTo("discovery")}
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              isDiscoveryActive
                ? "bg-[rgb(0,157,224)] text-white hover:bg-[rgb(0,147,214)]"
                : "bg-transparent text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-bold text-sm">
              {lang === "el" ? "Προτάσεις" : "Discovery"}
            </span>
          </button>
          <button
            onClick={() => navigateTo("restaurants")}
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              isRestaurantsActive
                ? "bg-[rgb(0,157,224)] text-white hover:bg-[rgb(0,147,214)]"
                : "bg-transparent text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Utensils className="w-5 h-5" />
            <span className="font-bold text-sm">
              {lang === "el" ? "Εστιατόρια" : "Restaurants"}
            </span>
          </button>
          <button
            onClick={() => navigateTo("stores")}
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              isStoresActive
                ? "bg-[rgb(0,157,224)] text-white hover:bg-[rgb(0,147,214)]"
                : "bg-transparent text-gray-300 hover:bg-gray-800"
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="font-bold text-sm">
              {lang === "el" ? "Καταστήματα" : "Stores"}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
