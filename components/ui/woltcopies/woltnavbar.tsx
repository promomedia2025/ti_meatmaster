"use client";

import { WoltLocation } from "./location";
import WoltSearchBar from "./woltsearchbar";
import { LocationModal } from "@/components/location-modal";
import { AuthModal } from "@/components/auth-modal";
import { SearchResultsOverlay } from "@/components/search-results-overlay";
import { SearchTags } from "@/components/search-tags";
import { CartSidebar } from "@/components/cart-sidebar";
import { ActiveOrdersDropdown } from "@/components/active-orders-dropdown";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLocation } from "@/lib/location-context";
import { useAuth } from "@/lib/auth-context";
import { useServerCart } from "@/lib/server-cart-context";
import { useLocationFromUrl } from "@/lib/use-location-from-url";
import { useCartSidebar } from "@/lib/cart-sidebar-context";
import { type Locale } from "@/lib/i18n/config";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, X, ShoppingCart, Package } from "lucide-react";
import Logo from "@/public/logo.png";
import Link from "next/link";
import LocationCartCTA from "@/components/LocationCartCTA"; // 👈 ADDED

interface WoltNavbarProps {
  lang: Locale;
  dict: any;
}

export function WoltNavbar({ lang, dict }: WoltNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { globalSummary, getLocationCart } = useServerCart();
  const { locationId } = useLocationFromUrl();
  const {
    isCartSidebarOpen,
    setIsCartSidebarOpen,
    cartViewLocationId,
    setCartViewLocationId,
  } = useCartSidebar();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [cityName, setCityName] = useState("Location");
  const [isLoadingCity, setIsLoadingCity] = useState(true);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showCartIcon, setShowCartIcon] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isActiveOrdersOpen, setIsActiveOrdersOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const { coordinates, refreshAddress } = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const navbarRef = useRef<HTMLDivElement>(null);

  // Check if we're on a restaurant or location page
  const isRestaurantPage =
    pathname?.startsWith("/restaurant/") || pathname?.startsWith("/location/");

  // Show cart icon on initial load if user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isSearchExpanded) {
      setShowCartIcon(true);
    }
  }, [isAuthenticated, isSearchExpanded]);

  // Reset selected tags when search closes
  useEffect(() => {
    if (!isSearchExpanded) {
      setSelectedTags([]);
    }
  }, [isSearchExpanded]);

  // Close auth modal when navigating to forgot-password route
  useEffect(() => {
    if (pathname?.includes("/forgot-password")) {
      setIsAuthModalOpen(false);
    }
  }, [pathname]);

  // Handle scroll to show/hide background
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch city from IP on initial load
  useEffect(() => {
    const fetchCityFromIP = async () => {
      try {
        // Call our internal API route instead of external APIs
        const response = await fetch("/api/get-location");

        if (response.ok) {
          const data = await response.json();

          if (data.city) {
            setCityName(data.city);
          }
        }
      } catch (error) {
        // Error handling without logging
      } finally {
        setIsLoadingCity(false);
      }
    };

    fetchCityFromIP();
  }, []);

  // Refresh address when language changes
  useEffect(() => {
    if (coordinates) {
      refreshAddress(lang);
    }
  }, [lang, coordinates, refreshAddress]);

  // Update location display when coordinates change (user selects location)
  useEffect(() => {
    if (!coordinates) return;

    const fetchLocationFromCoordinates = async () => {
      try {
        setIsLoadingCity(true);
        const response = await fetch(
          `/api/geocode?lat=${coordinates.latitude}&lon=${coordinates.longitude}&lang=${lang}`
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const address = result.data.address || {};

            // Extract street, house number, and postal code
            const street = address.road || address.street || "";
            const houseNumber = address.house_number || "";
            const postcode = address.postcode || "";

            // Build display string: "Street HouseNumber, PostalCode, City"
            const parts = [];
            if (street && houseNumber) {
              parts.push(`${street} ${houseNumber}`);
            } else if (street) {
              parts.push(street);
            }
            if (postcode) {
              parts.push(postcode);
            }
            if (address.city) {
              parts.push(address.city);
            }

            const locationDisplay =
              parts.length > 0
                ? parts.join(", ")
                : address.suburb ||
                  address.neighbourhood ||
                  address.city ||
                  "Location";

            setCityName(locationDisplay);
          }
        }
      } catch (error) {
        // Error handling without logging
      } finally {
        setIsLoadingCity(false);
      }
    };

    fetchLocationFromCoordinates();
  }, [coordinates, lang]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is on the profile button itself
      const profileButton = document.querySelector("[data-profile-button]");
      if (profileButton && profileButton.contains(target)) {
        return; // Don't close if clicking on the profile button
      }

      // Check if click is on the profile dropdown itself
      const profileDropdown = document.querySelector("[data-profile-dropdown]");
      if (profileDropdown && profileDropdown.contains(target)) {
        return; // Don't close if clicking inside the dropdown
      }

      // Close the dropdown if clicking outside
      if (isProfileDialogOpen) {
        setIsProfileDialogOpen(false);
      }
    };

    if (isProfileDialogOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDialogOpen]);

  // Close search when clicking outside (but not on search results or tags)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is on search results overlay
      const searchResultsOverlay = document.querySelector(
        "[data-search-results]"
      );
      if (searchResultsOverlay && searchResultsOverlay.contains(target)) {
        return; // Don't close if clicking on search results
      }

      // Check if click is on search tags
      const searchTags = document.querySelector("[data-search-tags]");
      if (searchTags && searchTags.contains(target)) {
        return; // Don't close if clicking on search tags
      }

      // Check if click is on the navbar (search bar, profile, etc.)
      if (navbarRef.current && navbarRef.current.contains(target)) {
        return; // Don't close if clicking on navbar elements
      }

      // Close search if clicking outside all the above areas
      if (isSearchExpanded) {
        setIsSearchExpanded(false);
        // Delay showing cart icon until after animation completes (300ms)
        setTimeout(() => {
          setShowCartIcon(true);
        }, 300);
      }
    };

    if (isSearchExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchExpanded]);

  const handleSearchToggle = (isExpanded: boolean) => {
    setIsSearchExpanded(isExpanded);

    if (!isExpanded) {
      // Delay showing cart icon until after animation completes (300ms)
      setTimeout(() => {
        setShowCartIcon(true);
      }, 300);
    } else {
      // Hide cart icon immediately when expanding
      setShowCartIcon(false);
    }
  };

  const handleProfileClick = () => {
    if (isSearchExpanded) {
      setIsSearchExpanded(false);
      // Delay showing cart icon until after animation completes (300ms)
      setTimeout(() => {
        setShowCartIcon(true);
      }, 300);
    } else {
      setIsActiveOrdersOpen(false); // Close active orders dropdown
      setIsProfileDialogOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileDialogOpen(false);
    } catch (error) {
      // Error handling without logging
    }
  };

  const handleAuthClick = () => {
    setIsAuthModalOpen(true);
    setAuthMode("login");
    setIsProfileDialogOpen(false);
  };

  return (
    <>
      {/* Blur overlay for entire screen when search is expanded */}
      {isSearchExpanded && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30" />
      )}

      <div
        ref={navbarRef}
        className={`sticky top-0 flex flex-col py-2 justify-between md:px-4 px-2 z-50 transition-all duration-300 ${
          isRestaurantPage
            ? "bg-transparent"
            : isScrolled
            ? "bg-[#242424]"
            : "bg-transparent"
        }`}
      >
        {/* Dark gray background overlay - only show on non-restaurant pages or when search is expanded */}
        {!isRestaurantPage && (
          <div
            className={`absolute top-0 right-0 h-full transition-all duration-300 ease-in-out ${
              isSearchExpanded ? "w-full opacity-100" : "w-0 opacity-0"
            }`}
            style={{ backgroundColor: "#242424" }}
          />
        )}
        {isRestaurantPage && isSearchExpanded && (
          <div
            className="absolute top-0 right-0 h-full w-full opacity-100 transition-all duration-300 ease-in-out"
            style={{ backgroundColor: "#242424" }}
          />
        )}

        <div className="relative z-10 flex items-center gap-[10px] justify-between max-w-[1500px] w-full mx-auto">
          {/* Left section: Logo + Location */}
          <div className="flex items-center gap-8 flex-shrink-0 ml-2">
            <Link href={`/${lang}`}>
              <Image
                src="/logo_1.png"
                alt="Logo"
                width={90}
                height={68}
                className="w-[70px] h-[60px] scale-100"
              />
            </Link>
            {/* Location on desktop - next to logo, only when not scrolled and search not expanded */}
            {!isScrolled && !isSearchExpanded && (
              <div className="hidden lg:block">
                <WoltLocation
                  onClick={() => setIsLocationModalOpen(true)}
                  cityName={cityName}
                  isLoading={isLoadingCity}
                  dict={dict}
                />
              </div>
            )}
          </div>

          {/* Right section: Mobile search, Active Orders, Profile, Cart */}
          <div className="flex-1 h-[50px] flex items-center justify-end gap-2 sm:flex-none sm:flex-shrink-0">
            <div className="sm:hidden">
              <WoltSearchBar
                onToggle={handleSearchToggle}
                isExpanded={isSearchExpanded}
                onSearchQueryChange={setSearchQuery}
                placeholder={dict.navigation.search}
              />
            </div>
            {/* Active Orders Button */}
            {isAuthenticated && (
              <div
                className={`relative ${
                  isSearchExpanded ? "hidden sm:block" : ""
                }`}
              >
                <button
                  onClick={() => {
                    setIsProfileDialogOpen(false); // Close profile dropdown
                    setIsActiveOrdersOpen(!isActiveOrdersOpen);
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-background hover:bg-muted border-2 border-border transition-colors focus-visible:ring-2 focus-visible:ring-[#FF9800] focus-visible:border-[#FF9800] focus-visible:outline-none"
                >
                  <Package
                    className="w-5 h-5 text-muted-foreground"
                    strokeWidth={2.5}
                  />
                </button>
                <ActiveOrdersDropdown
                  isOpen={isActiveOrdersOpen}
                  onClose={() => setIsActiveOrdersOpen(false)}
                />
              </div>
            )}
            {/* Language Switcher */}
            <div
              className={`hidden sm:block ${
                isSearchExpanded ? "hidden sm:hidden" : ""
              }`}
            >
              <LanguageSwitcher currentLang={lang} />
            </div>
            <div className="relative">
              <button
                data-profile-button
                onClick={handleProfileClick}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-background hover:bg-muted border-2 border-border transition-colors focus-visible:ring-2 focus-visible:ring-[#FF9800] focus-visible:border-[#FF9800] focus-visible:outline-none"
              >
                {isSearchExpanded ? (
                  <X
                    className="w-5 h-5 text-muted-foreground"
                    strokeWidth={2.5}
                  />
                ) : (
                  <User
                    className="w-5 h-5 text-muted-foreground"
                    strokeWidth={2.5}
                  />
                )}
              </button>

              {/* Profile Dropdown */}
              {isProfileDialogOpen && (
                <div
                  data-profile-dropdown
                  className="absolute top-13 right-[5px] bg-background border border-border rounded-lg shadow-lg min-w-[200px] z-[70]"
                >
                  {/* Inverted triangle */}
                  <div className="absolute -top-2 right-2 w-4 h-4 bg-background border-l border-t border-border transform rotate-45"></div>
                  {!isAuthenticated ? (
                    <div className="py-2">
                      <div
                        className="px-4 py-3 border-b border-border cursor-pointer hover:bg-muted transition-colors"
                        onClick={handleAuthClick}
                      >
                        {dict.navigation.loginOrRegister}
                      </div>
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-foreground text-sm">
                          {dict.navigation.language}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      <div
                        className="px-4 py-3 border-b border-border cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => {
                          router.push(`/${lang}/user`);
                          setIsProfileDialogOpen(false);
                        }}
                      >
                        <p className="text-foreground text-sm">
                          {dict.navigation.profile}
                        </p>
                      </div>
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-foreground text-sm">
                          {dict.navigation.language}
                        </p>
                      </div>
                      <div className="px-4 py-3">
                        <button
                          onClick={handleLogout}
                          className="text-foreground text-sm hover:text-muted-foreground transition-colors"
                        >
                          {dict.navigation.logout}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Buttons */}
{isAuthenticated && (
  <div
    className={`flex items-center gap-3 ${
      isSearchExpanded ? "hidden sm:flex" : ""
    }`}
  >
    {pathname.includes("/location/") && locationId && (
      <div
        className="hidden md:flex"
        onClick={() => setCartViewLocationId(locationId)}
      >
        <LocationCartCTA locationId={locationId} />
      </div>
    )}
  </div>
)}

          </div>
        </div>

        {/* Search Tags - only show when search is expanded */}
        {isSearchExpanded && (
          <div className="relative z-10 max-w-[1600px] w-full mx-auto">
            <SearchTags
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>
        )}

        {/* Location below navbar - only on mobile/tablet, hidden on desktop */}
        {!isScrolled && (
          <div
            className={`lg:hidden relative h-[50px] flex items-center transition-all duration-300 max-w-[1600px] w-full mx-auto ${
              isSearchExpanded ? "z-[-1]" : "z-0"
            }`}
          >
            <WoltLocation
              onClick={() => setIsLocationModalOpen(true)}
              cityName={cityName}
              isLoading={isLoadingCity}
              dict={dict}
            />
          </div>
        )}
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          mode={authMode}
        />
      </div>

      {/* Search Results - positioned to connect with search bar */}
      {isSearchExpanded && (
        <div className="relative z-[50] -mt-2">
          <SearchResultsOverlay
            isOpen={isSearchExpanded}
            onClose={() => setIsSearchExpanded(false)}
            searchQuery={searchQuery}
            selectedTags={selectedTags}
          />
        </div>
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartSidebarOpen}
        onClose={() => setIsCartSidebarOpen(false)}
        locationId={cartViewLocationId}
      />
    </>
  );
}
