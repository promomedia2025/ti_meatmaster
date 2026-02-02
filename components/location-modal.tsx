"use client";

import { X, MapPin, Loader2, Navigation, Home, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useLocation } from "@/lib/location-context";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "@/lib/i18n/translations-provider";
import GooglePlacesCustom from "./google-places-custom";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet?: (data: {
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
  }) => void;
  initialAddress?: string;
}

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  bell_name?: string | null;
  floor?: string | null;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export function LocationModal({
  isOpen,
  onClose,
  onLocationSet,
  initialAddress,
}: LocationModalProps) {
  const [address, setAddress] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressList, setShowAddressList] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const { setCoordinates, reverseGeocode, setFormattedAddress } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { lang, dict } = useTranslations();

  // Load saved location when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialAddress) {
        setAddress(initialAddress);
        console.log("📍 Using initial address:", initialAddress);
      } else {
        setAddress("");
      }
    } else {
      setAddress("");
    }
  }, [isOpen, initialAddress]);

  // Load saved addresses
  const loadSavedAddresses = async () => {
    setLoadingAddresses(true);
    try {
      if (isAuthenticated && user?.id) {
        const response = await fetch(
          `/api/address-book?customer_id=${user.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("📚 Fetched addresses for location modal:", data);

          if (data.success && data.data && data.data.addresses) {
            const addressList = data.data.addresses.map((apiAddress: any) => ({
              id: apiAddress.id?.toString() || `api-${Math.random()}`,
              label:
                apiAddress.address_1 ||
                apiAddress.label ||
                apiAddress.name ||
                "Address",
              address:
                apiAddress.formatted_address ||
                apiAddress.address ||
                apiAddress.full_address ||
                apiAddress.address_1,
              bell_name: apiAddress.bell_name || null,
              floor: apiAddress.floor || null,
              coordinates: apiAddress.coordinates
                ? {
                    latitude: parseFloat(apiAddress.coordinates.latitude),
                    longitude: parseFloat(apiAddress.coordinates.longitude),
                  }
                : undefined,
            }));
            setSavedAddresses(addressList);
          }
        }
      }
    } catch (error) {
      console.error("Error loading saved addresses:", error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
  };

  const handleGooglePlaceSelect = async (place: any) => {
    if (place.formatted_address && place.geometry?.location) {
      const address = place.formatted_address;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      console.log("📍 Google Places selected:", { address, lat, lng });

      setAddress(address);
      setShowAddressList(false);

      const coordinates = { latitude: lat, longitude: lng };
      setCoordinates(coordinates);

      const addressComponents = place.address_components || [];
      const street = addressComponents.find((c: any) =>
        c.types.includes("route")
      )?.long_name;
      const houseNumber = addressComponents.find((c: any) =>
        c.types.includes("street_number")
      )?.long_name;
      const postalCode = addressComponents.find((c: any) =>
        c.types.includes("postal_code")
      )?.long_name;
      const city =
        addressComponents.find((c: any) => c.types.includes("locality"))
          ?.long_name ||
        addressComponents.find((c: any) =>
          c.types.includes("administrative_area_level_3")
        )?.long_name ||
        addressComponents.find((c: any) => c.types.includes("sublocality"))
          ?.long_name ||
        "";

      const formattedAddress = {
        street: [street, houseNumber].filter(Boolean).join(" ") || address,
        area: city || "",
        postcode: postalCode || "",
        fullAddress: address,
      };
      setFormattedAddress(formattedAddress);

      if (onLocationSet) {
        onLocationSet({
          coordinates,
          address: {
            fullAddress: address,
            city: city || "",
            street: street || "",
            houseNumber: houseNumber || "",
            postalCode: postalCode || "",
          },
        });
      }

      setTimeout(() => {
        onClose();
      }, 300);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser");
      return;
    }

    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          });
        }
      );

      const { latitude, longitude } = position.coords;
      console.log("📍 Current coordinates:", { latitude, longitude });

      const coordinates = { latitude, longitude };
      setCoordinates(coordinates);

      try {
        const formattedAddress = await reverseGeocode(
          latitude,
          longitude,
          lang
        );
        if (formattedAddress) {
          setFormattedAddress(formattedAddress);
          setAddress(formattedAddress.fullAddress);
          console.log(
            "📍 Formatted address set from current location:",
            formattedAddress
          );
        }
      } catch (error) {
        console.error("❌ Error during reverse geocoding:", error);
        setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }

      if (onLocationSet) {
        onLocationSet({ coordinates });
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Failed to get your location");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}&lang=${lang}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          const firstResult = result.data[0];
          console.log("📍 Geocoded address:", firstResult.display_name);
          return {
            latitude: parseFloat(firstResult.lat),
            longitude: parseFloat(firstResult.lon),
          };
        }
      }
      throw new Error("No coordinates found for address");
    } catch (error) {
      console.error("Error geocoding address:", error);
      throw error;
    }
  };

  const handleSavedAddressSelect = async (savedAddress: SavedAddress) => {
    setAddress(savedAddress.address);
    setShowAddressList(false);

    console.log("📍 Selected saved address:", savedAddress.address);

    if (savedAddress.coordinates) {
      const coordinates = savedAddress.coordinates;
      console.log("📍 Using saved address coordinates:", coordinates);

      setCoordinates(coordinates);

      try {
        const formattedAddr = await reverseGeocode(
          coordinates.latitude,
          coordinates.longitude,
          lang
        );
        if (formattedAddr) {
          const formattedAddressWithExtras = {
            ...formattedAddr,
            bell_name: savedAddress.bell_name || null,
            floor: savedAddress.floor || null,
          };
          setFormattedAddress(formattedAddressWithExtras);
          console.log(
            "📍 Formatted address set from saved address:",
            formattedAddressWithExtras
          );
        }
      } catch (error) {
        console.error("❌ Error during reverse geocoding:", error);
      }

      if (onLocationSet) {
        onLocationSet({ coordinates });
      }

      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      try {
        const coordinates = await geocodeAddress(savedAddress.address);
        console.log("📍 Geocoded saved address:", coordinates);

        setCoordinates(coordinates);

        try {
          const formattedAddr = await reverseGeocode(
            coordinates.latitude,
            coordinates.longitude,
            lang
          );
          if (formattedAddr) {
            const formattedAddressWithExtras = {
              ...formattedAddr,
              bell_name: savedAddress.bell_name || null,
              floor: savedAddress.floor || null,
            };
            setFormattedAddress(formattedAddressWithExtras);
            console.log(
              "📍 Formatted address set from geocoded saved address:",
              formattedAddressWithExtras
            );
          }
        } catch (error) {
          console.error("❌ Error during reverse geocoding:", error);
        }

        if (onLocationSet) {
          onLocationSet({ coordinates });
        }

        setTimeout(() => {
          onClose();
        }, 300);
      } catch (error) {
        console.error("❌ Error geocoding saved address:", error);
        alert("Αποτυχία επεξεργασίας της αποθηκευμένης διεύθυνσης");
      }
    }
  };

  const handleContinue = async () => {
    if (!address.trim()) {
      alert("Παρακαλώ εισάγετε μια διεύθυνση");
      return;
    }

    const postalCodePattern = /\b\d{3}\s?\d{2}\b/;
    if (!postalCodePattern.test(address)) {
      alert(
        "Παρακαλώ συμπεριλάβετε τον ταχυδρομικό κώδικα στη διεύθυνση\n\nΠαράδειγμα: Υδρας 24, 15342"
      );
      return;
    }

    try {
      console.log("📍 Geocoding address:", address);
      const coordinates = await geocodeAddress(address);
      console.log("📍 Address coordinates:", coordinates);

      setCoordinates(coordinates);

      const postalCodeMatch = address.match(/\b(\d{3}\s?\d{2})\b/);
      const postcode = postalCodeMatch ? postalCodeMatch[1] : "";

      const streetPart = address
        .replace(/\b\d{3}\s?\d{2}\b/, "")
        .replace(/,\s*$/, "")
        .trim();

      const addressParts = address.split(",").map((part) => part.trim());
      const cityPart =
        addressParts.length > 1
          ? addressParts[addressParts.length - 1]
          : "Αθήνα";

      const customFormattedAddress = {
        street: streetPart,
        area: cityPart,
        postcode: postcode,
        fullAddress: address,
      };

      setFormattedAddress(customFormattedAddress);
      console.log(
        "📍 Using typed address as formatted address:",
        customFormattedAddress
      );

      if (onLocationSet) {
        onLocationSet({ coordinates });
      }

      onClose();
    } catch (error) {
      console.error("Error processing address:", error);
      alert(
        lang === "el"
          ? "Αποτυχία επεξεργασίας της διεύθυνσης. Παρακαλώ δοκιμάστε ξανά."
          : "Failed to process address. Please try again."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md mx-4 text-white shadow-2xl">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Title */}
        <h2 className="text-xl font-bold mb-6 text-white tracking-tight">
          {dict.locationModal.title}
        </h2>

        {/* Country dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            {lang === "el" ? "Χώρα" : "Country"}
          </label>
          <Select defaultValue="greece">
            <SelectTrigger className="w-full bg-black border-zinc-700 text-white focus:ring-[#ff9328] focus:border-[#ff9328]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="greece" className="text-white hover:bg-zinc-800">
                {lang === "el" ? "Ελλάδα" : "Greece"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Saved Addresses */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-zinc-400">
              {dict.locationModal.savedAddresses}
            </label>
            <button
              onClick={() => {
                setShowAddressList(!showAddressList);
                if (!showAddressList && savedAddresses.length === 0) {
                  loadSavedAddresses();
                }
              }}
              className="text-[#ff9328] text-sm font-medium hover:text-[#a03036] transition-colors"
            >
              {showAddressList
                ? lang === "el"
                  ? "Απόκρυψη"
                  : "Hide"
                : lang === "el"
                ? "Εμφάνιση"
                : "Show"}
            </button>
          </div>

          {showAddressList && (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar bg-black/20 p-2 rounded-lg border border-zinc-800/50">
              {loadingAddresses ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, index) => (
                    <div key={index} className="space-y-2 p-2">
                      <div className="h-3 w-3/4 bg-zinc-800 animate-pulse rounded"></div>
                      <div className="h-2 w-1/2 bg-zinc-800 animate-pulse rounded"></div>
                    </div>
                  ))}
                </div>
              ) : savedAddresses.length > 0 ? (
                savedAddresses.map((savedAddress) => (
                  <div
                    key={savedAddress.id}
                    onClick={() => handleSavedAddressSelect(savedAddress)}
                    className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg cursor-pointer hover:bg-zinc-800 hover:border-[#ff9328]/50 border border-transparent transition-all group"
                  >
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center border border-zinc-800 group-hover:border-[#ff9328] transition-colors">
                      <MapPin className="w-4 h-4 text-zinc-400 group-hover:text-[#ff9328]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-bold truncate group-hover:text-[#ff9328] transition-colors">
                        {savedAddress.label}
                      </div>
                      <div className="text-zinc-500 text-xs truncate">
                        {savedAddress.address}
                      </div>
                      {(savedAddress.bell_name || savedAddress.floor) && (
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-500">
                          {savedAddress.bell_name && (
                            <span className="bg-black px-1.5 py-0.5 rounded border border-zinc-800">
                               {savedAddress.bell_name}
                            </span>
                          )}
                          {savedAddress.floor && (
                            <span className="bg-black px-1.5 py-0.5 rounded border border-zinc-800">
                               {savedAddress.floor}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-500 text-sm flex flex-col items-center gap-2">
                  <Home className="w-8 h-8 opacity-20" />
                  <span>
                    {lang === "el"
                    ? "Δεν έχετε αποθηκευμένες διευθύνσεις"
                    : "No saved addresses"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Address input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            {dict.locationModal.enterAddress}{" "}
            <span className="text-[#ff9328]">*</span>
          </label>
          <p className="text-xs text-zinc-500 mb-2 italic">
            {lang === "el"
              ? "Συμπεριλάβετε τον ταχυδρομικό κώδικα (π.χ. 15342)"
              : "Include postal code (e.g. 15342)"}
          </p>
          <div className="relative group">
            <GooglePlacesCustom
              value={address}
              onChange={handleAddressChange}
              onPlaceSelect={handleGooglePlaceSelect}
              placeholder={
                lang === "el" ? "π.χ. Υδρας 24, 15342" : "e.g. Ydras 24, 15342"
              }
              className="pr-24 bg-black border-zinc-700 text-white placeholder-zinc-600 focus:border-[#ff9328] focus:ring-1 focus:ring-[#ff9328]"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-zinc-900 rounded-md p-0.5 border border-zinc-800">
              <button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-[#ff9328]"
                title={dict.locationModal.useCurrentLocation}
              >
                {isGettingLocation ? (
                  <Skeleton className="w-4 h-4 rounded-full bg-[#ff9328]/20" />
                ) : (
                  <Navigation className="w-4 h-4 fill-current" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Continue button */}
        <Button
          onClick={handleContinue}
          className="w-full bg-[#ff9328] hover:bg-[#915316] text-white font-bold py-6 rounded-xl shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all"
        >
          {dict.common.confirm}
        </Button>

        {/* Decorative illustration placeholder removed for cleaner look */}
      </div>
    </div>
  );
}