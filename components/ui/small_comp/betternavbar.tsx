"use client";

import { WoltLocation } from "./location";
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
import { User, X, Package } from "lucide-react";
import Link from "next/link";
import LocationCartCTA from "@/components/LocationCartCTA";
import { PhoneRequiredModal } from "@/components/phone-required-modal";

interface BetterNavbarProps {
  lang: Locale;
  dict: any;
}

export function BetterNavbar({ lang, dict }: BetterNavbarProps) {
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
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const navbarRef = useRef<HTMLDivElement>(null);

  // --- HELPER FUNCTIONS FOR USER DATA ---
  const getInitials = () => {
    if (!user) return "";
    const first = user.first_name?.charAt(0) || "";
    const last = user.last_name?.charAt(0) || "";
    return (first + last).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?";
  };

  const getFullName = () => {
    if (!user) return "";
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return fullName || user.email || "User";
  };
  // ---------------------------------------

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

  // Handle Google OAuth callback - run immediately on mount
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuth = urlParams.get("google_auth");
    const error = urlParams.get("error");
    const userDataParam = urlParams.get("user_data");

    if (googleAuth === "success") {
      // Store user data if provided in URL (this is the structure from backend without id)
      if (userDataParam) {
        try {
          const userDataWithoutId = JSON.parse(decodeURIComponent(userDataParam));
          
          // Store this structure in localStorage (without id)
          localStorage.setItem("user", JSON.stringify(userDataWithoutId));
          sessionStorage.setItem("user", JSON.stringify(userDataWithoutId));
        } catch (e) {
          // Error parsing user data
        }
      }
      
      // Verify session (CRITICAL!) to get full user data including id
      const verifySession = async () => {
        try {
          const verifyResponse = await fetch("/api/auth/user", {
            method: "GET",
            credentials: "include", // Must include this!
          });

          const verifyData = await verifyResponse.json();
          
          if (verifyData.success && verifyData.data?.user) {
            // Transform to match User interface format
            const verifiedUser = verifyData.data.user;
            const userData = {
              id: verifiedUser.id,
              email: verifiedUser.email,
              first_name: verifiedUser.first_name,
              last_name: verifiedUser.last_name,
              telephone: verifiedUser.telephone || "",
              phone: verifiedUser.telephone || "",
              name: verifiedUser.name || `${verifiedUser.first_name} ${verifiedUser.last_name}`.trim(),
              date_of_birth: verifiedUser.date_of_birth,
              address: verifiedUser.address,
              city: verifiedUser.city,
              postcode: verifiedUser.postcode,
              created_at: verifiedUser.created_at,
              updated_at: verifiedUser.updated_at,
            };
            
            // Update auth context with verified user (includes id)
            refreshUser(userData);
            
            // Close modal
            setIsAuthModalOpen(false);
            
            // Remove query params
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
          } else {
            setIsAuthModalOpen(true);
            setAuthMode("login");
          }
        } catch (error) {
          setIsAuthModalOpen(true);
          setAuthMode("login");
        }
      };
      
      verifySession();
    } else if (error) {
      // Show error message
      setIsAuthModalOpen(true);
      setAuthMode("login");
      // Remove error from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []); // Run once on mount to check URL params

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

  // Update location display when coordinates change
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
            const street = address.road || address.street || "";
            const houseNumber = address.house_number || "";
            const postcode = address.postcode || "";
            const city = address.city || "";

            const parts = [];
            if (street && houseNumber) parts.push(`${street} ${houseNumber}`);
            else if (street) parts.push(street);
            if (postcode) parts.push(postcode);
            if (city) parts.push(city);

            const locationDisplay = parts.length > 0 
              ? parts.join(", ") 
              : address.suburb || address.neighbourhood || address.city || "Location";

            setCityName(locationDisplay);
          }
        }
      } catch (error) {
        // Error handling
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
      const profileButton = document.querySelector("[data-profile-button]");
      if (profileButton && profileButton.contains(target)) return;
      const profileDropdown = document.querySelector("[data-profile-dropdown]");
      if (profileDropdown && profileDropdown.contains(target)) return;

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

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const searchResultsOverlay = document.querySelector("[data-search-results]");
      if (searchResultsOverlay && searchResultsOverlay.contains(target)) return;
      const searchTags = document.querySelector("[data-search-tags]");
      if (searchTags && searchTags.contains(target)) return;
      if (navbarRef.current && navbarRef.current.contains(target)) return;

      if (isSearchExpanded) {
        setIsSearchExpanded(false);
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
      setTimeout(() => {
        setShowCartIcon(true);
      }, 300);
    } else {
      setShowCartIcon(false);
    }
  };

  const handleProfileClick = () => {
    if (isSearchExpanded) {
      setIsSearchExpanded(false);
      setTimeout(() => {
        setShowCartIcon(true);
      }, 300);
    } else {
      setIsActiveOrdersOpen(false);
      setIsProfileDialogOpen((prev) => !prev);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileDialogOpen(false);
    } catch (error) {
      // Error handling
    }
  };

  const handleAuthClick = () => {
    setIsAuthModalOpen(true);
    setAuthMode("login");
    setIsProfileDialogOpen(false);
  };

  return (
    <>
      <PhoneRequiredModal />
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
                src="/logo.png"
                alt="Logo"
                width={160}
                height={75}
                className="w-[160px] h-[75px] scale-100"
              />
            </Link>
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
              <LanguageSwitcher currentLang={lang} />
            </div>
            
            <div className={`hidden sm:block ${isSearchExpanded ? "hidden sm:hidden" : ""}`}>
              <LanguageSwitcher currentLang={lang} />
            </div>

            {/* Active Orders Button */}
            {isAuthenticated && (
              <div className={`relative ${isSearchExpanded ? "hidden sm:block" : ""}`}>
                <button
                  onClick={() => {
                    setIsProfileDialogOpen(false);
                    setIsActiveOrdersOpen(!isActiveOrdersOpen);
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-background hover:bg-muted border-2 border-border transition-colors focus-visible:ring-2 focus-visible:ring-[#FF9800] focus-visible:border-[#FF9800] focus-visible:outline-none"
                >
                  <Package className="w-5 h-5 text-muted-foreground" strokeWidth={2.5} />
                </button>
                <ActiveOrdersDropdown
                  isOpen={isActiveOrdersOpen}
                  onClose={() => setIsActiveOrdersOpen(false)}
                />
              </div>
            )}

            {/* User Profile Button & Dropdown */}
            <div className="relative">
              <button
                  data-profile-button
                  onClick={isAuthenticated ? handleProfileClick : handleAuthClick}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors focus-visible:outline-none
                  ${isAuthenticated
                    ? "bg-[var(--brand-border)] border-[var(--brand-border)] hover:bg-[var(--brand-hover)]"
                    : "bg-background border-border hover:bg-muted"
                  }
                `}
              >
                {isSearchExpanded ? (
                  <X className={`w-5 h-5 stroke-[2.5px] ${isAuthenticated ? "text-white" : "text-muted-foreground"}`} />
                ) : (
                  <User className={`w-5 h-5 stroke-[2.5px] ${isAuthenticated ? "text-white" : "text-muted-foreground"}`} />
                )}
              </button>

              {isProfileDialogOpen && (
                <div
                  data-profile-dropdown
                  className="absolute top-14 right-0 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl min-w-[260px] z-[70] overflow-hidden origin-top-right animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ease-out"
                >
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-popover border-l border-t border-border transform rotate-45 z-10"></div>

                  {!isAuthenticated ? (
                    <div className="flex flex-col py-1 relative z-20 bg-popover">
                      <div
                        className="px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between group"
                        onClick={handleAuthClick}
                      >
                        <span className="font-medium">{dict.navigation.loginOrRegister}</span>
                        <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="h-[1px] bg-border mx-4 my-1"></div>
                      <div className="px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between group">
                        <p className="text-sm font-medium">{dict.navigation.language}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">English</span>
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col relative z-20 bg-popover">
                      {/* User Profile Header Card */}
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border group"
                        onClick={() => {
                          router.push(`/${lang}/user`);
                          setIsProfileDialogOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0 border border-border/50">
                            {getInitials()}
                          </div>
                          <div className="flex-1 flex flex-col overflow-hidden">
                            <span className="font-bold text-sm text-foreground truncate">
                              {getFullName()}
                            </span>
                            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                              {dict.navigation.profile}
                            </span>
                          </div>
                          <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <div className="px-4 py-3">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
                          >
                            {dict.navigation.logout}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Buttons */}
            {isAuthenticated && (
              <div className={`flex items-center gap-3 ${isSearchExpanded ? "hidden sm:flex" : ""}`}>
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

        {/* Search Tags */}
        {isSearchExpanded && (
          <div className="relative z-10 max-w-[1600px] w-full mx-auto">
            <SearchTags
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>
        )}

        {/* Location below navbar (mobile) */}
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

      {/* Search Results */}
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
