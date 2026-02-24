"use client";

import {
  Search,
  MapPin,
  Menu,
  X,
  Loader2,
  User,
  LogOut,
  ChevronDown,
  ShoppingCart,
  BookOpen,
  History,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LocationModal } from "./location-modal";
import { AuthModal } from "./auth-modal";
import { AddressBookModal } from "./address-book-modal";
import { useAuth } from "@/lib/auth-context";
import { useServerCart } from "@/lib/server-cart-context";
import { useLocation } from "@/lib/location-context";
import { useLocationFromUrl } from "@/lib/use-location-from-url";
import { useCartSidebar } from "@/lib/cart-sidebar-context";
import { AddressBookResponse } from "@/lib/types";

interface UserLocation {
  city: string;
  fullAddress: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  addressDetails: {
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    locality?: string;
    country?: string;
  };
}

export function Header() {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const {
    locationCarts,
    globalSummary,
    removeItem,
    updateQuantity,
    getLocationCart,
  } = useServerCart();
  const { setCoordinates } = useLocation();
  const { locationId } = useLocationFromUrl();
  const { setCartViewLocationId } = useCartSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isAddressBookModalOpen, setIsAddressBookModalOpen] = useState(false);
  const [selectedAddressForEdit, setSelectedAddressForEdit] = useState<
    string | undefined
  >(undefined);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);
  const [activeCartTab, setActiveCartTab] = useState<"carts" | "orders">(
    "carts"
  );
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoadingAddressBook, setIsLoadingAddressBook] = useState(false);
  const [locationImages, setLocationImages] = useState<Map<number, string>>(
    new Map()
  );
  const fetchedLocationIdsRef = useRef<Set<number>>(new Set());

  // Check if we're on a restaurant or location page
  const isRestaurantPage =
    pathname.startsWith("/restaurant/") || pathname.startsWith("/location/");

  // Debug log to help troubleshoot
  console.log("🔍 Header Debug:", {
    pathname,
    isRestaurantPage,
    isAuthenticated,
  });

  // Fetch location images for carts
  useEffect(() => {
    const fetchLocationImages = async () => {
      if (locationCarts.length === 0) return;

      const locationIds = locationCarts.map((cart) => cart.locationId);
      const missingIds = locationIds.filter(
        (id) =>
          !fetchedLocationIdsRef.current.has(id) &&
          !locationImages.has(id) &&
          !locationCarts.find((c) => c.locationId === id)?.locationImage
      );

      if (missingIds.length === 0) return;

      // Mark as being fetched to prevent duplicate requests
      missingIds.forEach((id) => fetchedLocationIdsRef.current.add(id));

      try {
        // Fetch all locations and filter by the ones we need
        const response = await fetch("/api/locations");
        const data = await response.json();

        if (data.success && data.data?.locations) {
          // Use functional update to add new images
          setLocationImages((prevImages) => {
            const updatedImages = new Map(prevImages);
            data.data.locations.forEach((location: any) => {
              if (
                missingIds.includes(location.id) &&
                location.images?.thumbnail?.url
              ) {
                updatedImages.set(location.id, location.images.thumbnail.url);
              }
            });
            return updatedImages;
          });
        }
      } catch (error) {
        console.error("Error fetching location images:", error);
        // Remove from fetched set on error so we can retry
        missingIds.forEach((id) => fetchedLocationIdsRef.current.delete(id));
      }
    };

    fetchLocationImages();
  }, [locationCarts]);

  // Handle scroll for background transparency (only on restaurant pages)
  useEffect(() => {
    if (!isRestaurantPage) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const threshold = viewportHeight * 0.1; // 30vw
      setIsScrolled(scrollTop > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isRestaurantPage]);

  // Close auth modal when navigating to forgot-password route
  useEffect(() => {
    if (pathname?.includes("/forgot-password")) {
      setIsAuthModalOpen(false);
    }
  }, [pathname]);

  // Handle Google OAuth callback - run immediately on mount
  useEffect(() => {
    // Read from window.location directly to ensure we get the params
    if (typeof window === "undefined") {
      console.log("⚠️ [HEADER] Window not available");
      return;
    }
    
    console.log("🔍 [HEADER] OAuth callback useEffect running, current URL:", window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuth = urlParams.get("google_auth");
    const error = urlParams.get("error");
    const userDataParam = urlParams.get("user_data");

    console.log("🔍 [HEADER] OAuth callback check:", {
      googleAuth,
      hasError: !!error,
      hasUserData: !!userDataParam,
      userDataParamLength: userDataParam?.length,
      fullUrl: window.location.href,
      allParams: Object.fromEntries(urlParams.entries()),
    });

    if (googleAuth === "success") {
      // Store user data if provided in URL (this is the structure from backend without id)
      if (userDataParam) {
        try {
          const userDataWithoutId = JSON.parse(decodeURIComponent(userDataParam));
          
          console.log("🔍 [HEADER] Parsed user data from URL:", userDataWithoutId);
          
          // Store this structure in localStorage (without id)
          localStorage.setItem("user", JSON.stringify(userDataWithoutId));
          sessionStorage.setItem("user", JSON.stringify(userDataWithoutId));
          
          // Verify it was stored
          const stored = localStorage.getItem("user");
          console.log("✅ Google OAuth user data stored (without id):", userDataWithoutId);
          console.log("✅ Verification - stored in localStorage:", stored);
          
          if (!stored) {
            console.error("❌ CRITICAL: Data was not stored in localStorage!");
          }
        } catch (e) {
          console.error("❌ Error parsing user data from OAuth callback:", e);
          console.error("❌ Raw userDataParam:", userDataParam);
        }
      } else {
        console.error("❌ No user_data parameter found in URL!");
        console.log("❌ All URL params:", Object.fromEntries(urlParams.entries()));
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
            console.error("❌ Session verification failed:", verifyData);
            setIsAuthModalOpen(true);
            setAuthMode("login");
          }
        } catch (error) {
          console.error("❌ Error verifying session:", error);
          setIsAuthModalOpen(true);
          setAuthMode("login");
        }
      };
      
      verifySession();
    } else if (error) {
      // Show error message
      console.error("Google OAuth error:", error);
      setIsAuthModalOpen(true);
      setAuthMode("login");
      // Remove error from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []); // Run once on mount to check URL params

  // Removed localStorage loading - location is managed in real-time only

  // Removed localStorage saving - location is managed in real-time only

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest(".user-dropdown")) {
          setIsUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          });
        }
      );

      const { latitude, longitude } = position.coords;

      // Log coordinates for debugging
      console.log("📍 Current Location Coordinates:");
      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);

      // Reverse geocoding to get detailed address information
      const addressInfo = await reverseGeocode(latitude, longitude);

      const location: UserLocation = {
        city: addressInfo.city,
        fullAddress: addressInfo.fullAddress,
        coordinates: { latitude, longitude },
        addressDetails: addressInfo.addressDetails,
      };

      console.log("🏠 Full Address Details:", location);
      setUserLocation(location);

      // Update coordinates in context for filtering
      setCoordinates({ latitude, longitude });
    } catch (error) {
      console.error("Error getting location:", error);
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied by user");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out");
            break;
          default:
            setLocationError("An unknown error occurred");
            break;
        }
      } else {
        setLocationError("Failed to get location");
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<{
    city: string;
    fullAddress: string;
    addressDetails: {
      street?: string;
      houseNumber?: string;
      postalCode?: string;
      locality?: string;
      country?: string;
    };
  }> => {
    try {
      // Using our server-side API to avoid CORS
      const response = await fetch(
        `/api/geocode?lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("No data returned from geocoding");
      }

      const data = result.data;

      // Extract detailed address information from Nominatim response
      const address = data.address || {};
      // Prioritize suburb/neighbourhood for more specific location, then city/town/village, then municipality as fallback
      const city =
        address.suburb ||
        address.neighbourhood ||
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        "Unknown Location";
      const street = address.road || "";
      const houseNumber = address.house_number || "";
      const postalCode = address.postcode || "";
      const locality = address.suburb || address.neighbourhood || "";
      const country = address.country || "";

      // Build full address string
      const fullAddress = data.display_name || "Unknown Location";

      return {
        city,
        fullAddress,
        addressDetails: {
          street,
          houseNumber,
          postalCode,
          locality,
          country,
        },
      };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return {
        city: "Unknown Location",
        fullAddress: "Unknown Location",
        addressDetails: {},
      };
    }
  };

  const handleLocationClick = () => {
    console.log("🖱️ Location button clicked");
    if (!userLocation && !isGettingLocation) {
      console.log("📍 Requesting current location...");
      getCurrentLocation();
    } else {
      console.log("📍 Opening location modal...");
      setIsLocationModalOpen(true);
    }
  };

  const handleLocationSet = (data: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    address?: {
      fullAddress: string;
      city: string;
      street?: string;
      houseNumber?: string;
      postalCode?: string;
    };
  }) => {
    console.log("📍 Location set from modal:", data);
    
    // Update coordinates in context
    setCoordinates(data.coordinates);

    // If address data is provided, update userLocation
    if (data.address) {
      const locationData: UserLocation = {
        city: data.address.city || "Unknown Location",
        fullAddress: data.address.fullAddress,
        coordinates: data.coordinates,
        addressDetails: {
          street: data.address.street,
          houseNumber: data.address.houseNumber,
          postalCode: data.address.postalCode,
        },
      };
      setUserLocation(locationData);
    }
    // No need to reload - coordinates are in context and RestaurantGrid will auto-update
  };

  const handleAddressBookClick = () => {
    // Close the dropdown and open the address book modal
    setIsUserDropdownOpen(false);
    setIsAddressBookModalOpen(true);
  };

  const handleOrderHistoryClick = () => {
    // Close the dropdown and navigate to order history page
    setIsUserDropdownOpen(false);
    router.push("/order-history");
  };

  const handleAddressSelect = (address: any) => {
    console.log("Selected address:", address);
    // Update user location with selected address
    if (address.coordinates) {
      const locationData = {
        city: address.address.split(",")[0] || address.address,
        fullAddress: address.address,
        coordinates: address.coordinates,
        addressDetails: {},
      };
      setUserLocation(locationData);

      // Update coordinates in context for filtering
      setCoordinates(address.coordinates);

      // No need to reload - coordinates are in context and RestaurantGrid will auto-update
    }
  };

  const handleAddNewAddress = () => {
    // Close address book modal and open location modal for new address
    setIsAddressBookModalOpen(false);
    setSelectedAddressForEdit(undefined); // Clear any selected address
    setIsLocationModalOpen(true);
  };

  const handleEditAddress = (address: any) => {
    // Close address book modal and open location modal with selected address
    console.log("🔍 Selected address for edit:", address);
    console.log("🔍 Address.address:", address.address);
    setIsAddressBookModalOpen(false);
    setSelectedAddressForEdit(address.address);
    setIsLocationModalOpen(true);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isRestaurantPage && isScrolled
            ? "bg-background border-b border-border"
            : isRestaurantPage
            ? "bg-transparent border-b border-transparent"
            : "bg-background border-b border-border"
        }`}
      >
        <div className="w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo and Location */}
            <div className="flex items-center gap-4 flex-shrink-0 min-w-0">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    W
                  </span>
                </div>
                <span className="text-xl font-bold text-foreground">Wolt</span>
              </button>

              {/* Location button - visible on desktop, horizontal next to logo */}
              <button
                className="hidden md:flex items-center gap-1 text-sm hover:text-primary transition-colors flex-shrink-0"
                onClick={handleLocationClick}
                disabled={isGettingLocation}
                title={
                  userLocation
                    ? userLocation.fullAddress
                    : "Click to set location"
                }
              >
                {isGettingLocation ? (
                  <Skeleton className="w-4 h-4 rounded" />
                ) : (
                  <MapPin className="w-4 h-4 text-primary" />
                )}
                <span className="text-foreground whitespace-nowrap">
                  {userLocation
                    ? `${
                        userLocation.addressDetails.street +
                        " " +
                        userLocation.addressDetails.houseNumber +
                        ", " +
                        userLocation.addressDetails.postalCode
                      }`
                    : "Πατηστε για εύρεση τοποθεσίας σας"}
                </span>
                <svg
                  className="w-4 h-4 text-muted-foreground"
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

            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Αναζήτηση στη Wolt..."
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* User Dropdown */}
                  <div className="relative user-dropdown">
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center gap-1 lg:gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {/* Show full text only on lg+ screens */}
                      <span className="hidden lg:inline text-foreground">
                        Το Προφιλ μου
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {isUserDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
                        <div className="py-2">
                          <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
                            {(() => {
                              console.log("🔍 User data in dropdown:", user);
                              const fullName =
                                user?.name ||
                                `${user?.first_name || ""} ${
                                  user?.last_name || ""
                                }`.trim();
                              console.log(
                                "🔍 Full name constructed:",
                                fullName
                              );
                              return fullName || user?.email;
                            })()}
                          </div>
                          <button
                            onClick={handleAddressBookClick}
                            disabled={isLoadingAddressBook}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoadingAddressBook ? (
                              <Skeleton className="w-4 h-4 rounded" />
                            ) : (
                              <BookOpen className="w-4 h-4" />
                            )}
                            My Address Book
                          </button>
                          <button
                            onClick={handleOrderHistoryClick}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                          >
                            <History className="w-4 h-4" />
                            Ιστορικό Παραγγελιών
                          </button>
                          <button
                            onClick={() => {
                              logout();
                              setIsUserDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Αποσύνδεση
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:text-primary"
                    onClick={() => {
                      setAuthMode("login");
                      setIsAuthModalOpen(true);
                    }}
                  >
                    Σύνδεση
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      setAuthMode("register");
                      setIsAuthModalOpen(true);
                    }}
                  >
                    Εγγραφή
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border">
              <div className="mt-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Αναζήτηση στη Wolt..."
                    className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <button
                className="flex items-center gap-1 text-sm mb-4 px-2 hover:text-primary transition-colors"
                onClick={handleLocationClick}
                disabled={isGettingLocation}
                title={
                  userLocation
                    ? userLocation.fullAddress
                    : "Click to set location"
                }
              >
                {isGettingLocation ? (
                  <Skeleton className="w-4 h-4 rounded" />
                ) : (
                  <MapPin className="w-4 h-4 text-primary" />
                )}
                <span className="text-foreground">
                  {userLocation ? userLocation.city : "Αθήνα"}
                </span>
                <svg
                  className="w-4 h-4 text-muted-foreground"
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

              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  {/* Cart Button */}
                  <Button
                    variant="ghost"
                    className="text-foreground hover:text-primary justify-start"
                    onClick={() => {
                      setIsCartSidebarOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Καλάθι{" "}
                    {globalSummary.totalItems > 0 &&
                      `(${globalSummary.totalItems})`}
                  </Button>

                  {/* Address Book */}
                  <Button
                    variant="ghost"
                    className="text-foreground hover:text-primary justify-start"
                    onClick={() => {
                      handleAddressBookClick();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    My Address Book
                  </Button>

                  {/* Order History */}
                  <Button
                    variant="ghost"
                    className="text-foreground hover:text-primary justify-start"
                    onClick={() => {
                      handleOrderHistoryClick();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <History className="w-4 h-4 mr-2" />
                    Ιστορικό Παραγγελιών
                  </Button>

                  {/* Profile/Logout */}
                  <Button
                    variant="ghost"
                    className="text-foreground hover:text-primary justify-start"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Αποσύνδεση
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className="text-foreground hover:text-primary justify-start"
                    onClick={() => {
                      setAuthMode("login");
                      setIsAuthModalOpen(true);
                    }}
                  >
                    Σύνδεση
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      setAuthMode("register");
                      setIsAuthModalOpen(true);
                    }}
                  >
                    Εγγραφή
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          setSelectedAddressForEdit(undefined);
        }}
        onLocationSet={handleLocationSet}
        initialAddress={selectedAddressForEdit}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
      />
      <AddressBookModal
        isOpen={isAddressBookModalOpen}
        onClose={() => setIsAddressBookModalOpen(false)}
        onAddressSelect={handleAddressSelect}
        onAddNewAddress={handleAddNewAddress}
        onEditAddress={handleEditAddress}
      />

      {/* Cart Sidebar */}
      {isCartSidebarOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCartSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="absolute right-0 top-0 h-full w-96 bg-[#1a1a1a] border-l border-border shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-white">
                Οι παραγγελίες σου
              </h2>
              <button
                onClick={() => setIsCartSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveCartTab("carts")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeCartTab === "carts"
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Καλάθια αγορών
              </button>
              <button
                onClick={() => setActiveCartTab("orders")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeCartTab === "orders"
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Παραγγελία ξανά
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeCartTab === "carts" ? (
                <div className="space-y-4">
                  {locationCarts.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Δεν υπάρχουν καλάθια αγορών</p>
                    </div>
                  ) : (
                    <>
                      {/* Location Carts */}
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {locationCarts.map((locationCart) => (
                          <div
                            key={locationCart.locationId}
                            className="bg-gray-800 rounded-lg p-4"
                          >
                            {/* Location Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {(locationCart.locationImage ||
                                  locationImages.get(
                                    locationCart.locationId
                                  )) && (
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                      src={
                                        locationCart.locationImage ||
                                        locationImages.get(
                                          locationCart.locationId
                                        ) ||
                                        ""
                                      }
                                      alt={locationCart.locationName}
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  </div>
                                )}
                                <h3 className="text-white font-medium truncate">
                                  {locationCart.locationName}
                                </h3>
                              </div>
                              <span className="text-gray-400 text-sm flex-shrink-0">
                                {locationCart.summary.count}{" "}
                                {locationCart.summary.count === 1
                                  ? "αντικείμενο"
                                  : "αντικείμενα"}
                              </span>
                            </div>

                            {/* Location Items */}
                            <div className="space-y-2">
                              {locationCart.items.map((item) => (
                                <div
                                  key={item.rowId}
                                  className="flex items-center justify-between p-2 bg-gray-700 rounded"
                                >
                                  <div className="flex-1">
                                    <h4 className="text-white text-sm font-medium">
                                      {item.name}
                                    </h4>
                                    <p className="text-gray-400 text-xs">
                                      €{item.price.toFixed(2)}
                                    </p>
                                    {item.comment && (
                                      <p className="text-gray-500 text-xs mt-1">
                                        Σχόλιο: {item.comment}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        updateQuantity(
                                          locationCart.locationId,
                                          item.rowId,
                                          item.qty - 1
                                        )
                                      }
                                      className="w-5 h-5 rounded-full bg-gray-600 text-white hover:bg-gray-500 flex items-center justify-center text-xs"
                                    >
                                      -
                                    </button>
                                    <span className="text-white text-sm w-6 text-center">
                                      {item.qty}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateQuantity(
                                          locationCart.locationId,
                                          item.rowId,
                                          item.qty + 1
                                        )
                                      }
                                      className="w-5 h-5 rounded-full bg-gray-600 text-white hover:bg-gray-500 flex items-center justify-center text-xs"
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() =>
                                        removeItem(
                                          locationCart.locationId,
                                          item.rowId
                                        )
                                      }
                                      className="ml-1 text-red-400 hover:text-red-300 text-xs"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Location Summary */}
                            <div className="mt-3 pt-3 border-t border-gray-600">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-gray-300 text-sm">
                                  Σύνολο:
                                </span>
                                <span className="text-white font-medium">
                                  €{locationCart.summary.total.toFixed(2)}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/checkout?locationId=${locationCart.locationId}`
                                  )
                                }
                                className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                              >
                                Ολοκληρωση παραγγελιας
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Global Cart Summary */}
                      <div className="border-t border-gray-700 pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-white font-medium">
                            Συνολικό ποσό ({globalSummary.totalLocations}{" "}
                            {globalSummary.totalLocations === 1
                              ? "εστιατόριο"
                              : "εστιατόρια"}
                            ):
                          </span>
                          <span className="text-white font-bold">
                            €{globalSummary.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                          Συνέχεια παραγγελίας
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Δεν υπάρχουν προηγούμενες παραγγελίες</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
