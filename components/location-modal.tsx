"use client";

import { X, MapPin, Loader2, Navigation } from "lucide-react";
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
      // If initialAddress is provided, use it
      if (initialAddress) {
        setAddress(initialAddress);
        console.log("📍 Using initial address:", initialAddress);
      } else {
        // Clear address if no initial address
        setAddress("");
      }
    } else {
      // Clear address when modal closes
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

  // Handle address input change
  const handleAddressChange = (value: string) => {
    setAddress(value);
    // Google Places autocomplete handles suggestions
  };

  // Handle Google Places selection
  const handleGooglePlaceSelect = async (place: any) => {
    if (place.formatted_address && place.geometry?.location) {
      const address = place.formatted_address;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      console.log("📍 Google Places selected:", { address, lat, lng });

      // Update the address input
      setAddress(address);

      // Hide saved addresses list
      setShowAddressList(false);

      // Update coordinates in context
      const coordinates = { latitude: lat, longitude: lng };
      setCoordinates(coordinates);

      // Parse Google Places address_components to extract address details
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

      // Create formatted address for location context (similar to reverseGeocode format)
      const formattedAddress = {
        street: [street, houseNumber].filter(Boolean).join(" ") || address,
        area: city || "",
        postcode: postalCode || "",
        fullAddress: address,
      };
      setFormattedAddress(formattedAddress);

      // Call the callback to update parent component with address data
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

      // Close the modal automatically
      setTimeout(() => {
        onClose();
      }, 300);
    }
  };

  // Get current location and autocomplete address
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

      // Set coordinates in context
      const coordinates = { latitude, longitude };
      setCoordinates(coordinates);

      // Trigger reverse geocoding to get formatted address
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
        // Fallback to coordinates if geocoding fails
        setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }

      // Call the callback to update parent component
      if (onLocationSet) {
        onLocationSet({ coordinates });
      }

      // Close the modal automatically
      setTimeout(() => {
        onClose();
      }, 500); // Small delay so user can see the address was filled
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Failed to get your location");
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Geocode address to get coordinates
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
    // Fill the input field with the selected address
    setAddress(savedAddress.address);
    setShowAddressList(false);

    console.log("📍 Selected saved address:", savedAddress.address);

    // If the saved address has coordinates, use them directly
    if (savedAddress.coordinates) {
      const coordinates = savedAddress.coordinates;
      console.log("📍 Using saved address coordinates:", coordinates);

      // Update coordinates in context
      setCoordinates(coordinates);

      // Trigger reverse geocoding to get formatted address
      try {
        const formattedAddr = await reverseGeocode(
          coordinates.latitude,
          coordinates.longitude,
          lang
        );
        if (formattedAddr) {
          // Include bell_name and floor in the formatted address
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

      // Call the callback to update parent component
      if (onLocationSet) {
        onLocationSet({ coordinates });
      }

      // Close the modal automatically
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      // If no coordinates, geocode the address
      try {
        const coordinates = await geocodeAddress(savedAddress.address);
        console.log("📍 Geocoded saved address:", coordinates);

        // Update coordinates in context
        setCoordinates(coordinates);

        // Trigger reverse geocoding to get formatted address
        try {
          const formattedAddr = await reverseGeocode(
            coordinates.latitude,
            coordinates.longitude,
            lang
          );
          if (formattedAddr) {
            // Include bell_name and floor in the formatted address
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

        // Call the callback to update parent component
        if (onLocationSet) {
          onLocationSet({ coordinates });
        }

        // Close the modal automatically
        setTimeout(() => {
          onClose();
        }, 300);
      } catch (error) {
        console.error("❌ Error geocoding saved address:", error);
        alert("Αποτυχία επεξεργασίας της αποθηκευμένης διεύθυνσης");
      }
    }
  };

  // Handle continue button click
  const handleContinue = async () => {
    if (!address.trim()) {
      alert("Παρακαλώ εισάγετε μια διεύθυνση");
      return;
    }

    // Validate that postal code is included (Greek format: 5 digits, optionally with space)
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

      // Update coordinates in context
      setCoordinates(coordinates);

      // Create a custom formatted address from the typed address instead of reverse geocoding
      // This preserves the user's exact input

      // Extract postcode using regex (Greek format: 5 digits, optionally with space)
      const postalCodeMatch = address.match(/\b(\d{3}\s?\d{2})\b/);
      const postcode = postalCodeMatch ? postalCodeMatch[1] : "";

      // Remove postcode from address to get street part
      const streetPart = address
        .replace(/\b\d{3}\s?\d{2}\b/, "")
        .replace(/,\s*$/, "")
        .trim();

      // Extract city (everything after the last comma, or default to Athens)
      const addressParts = address.split(",").map((part) => part.trim());
      const cityPart =
        addressParts.length > 1
          ? addressParts[addressParts.length - 1]
          : "Αθήνα";

      const customFormattedAddress = {
        street: streetPart,
        area: cityPart,
        postcode: postcode,
        fullAddress: address, // Use the original typed address
      };

      setFormattedAddress(customFormattedAddress);
      console.log(
        "📍 Using typed address as formatted address:",
        customFormattedAddress
      );
      console.log(
        "📍 Full address being set:",
        customFormattedAddress.fullAddress
      );

      // Call the callback to update parent component
      if (onLocationSet) {
        onLocationSet({ coordinates });
      }

      // Close modal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md mx-4 text-white">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-6 text-white">
          {dict.locationModal.title}
        </h2>

        {/* Country dropdown */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            {lang === "el" ? "Χώρα" : "Country"}
          </label>
          <Select defaultValue="greece">
            <SelectTrigger className="w-full bg-[#2a2a2a] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-gray-600">
              <SelectItem value="greece" className="text-white">
                {lang === "el" ? "Ελλάδα" : "Greece"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Saved Addresses */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-gray-400">
              {dict.locationModal.savedAddresses}
            </label>
            <button
              onClick={() => {
                setShowAddressList(!showAddressList);
                if (!showAddressList && savedAddresses.length === 0) {
                  loadSavedAddresses();
                }
              }}
              className="text-primary text-sm hover:text-primary/80 transition-colors"
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
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {loadingAddresses ? (
                <div className="space-y-2 py-2">
                  {[...Array(2)].map((_, index) => (
                    <div key={index} className="space-y-1">
                      <div className="h-3 w-3/4 bg-muted animate-pulse rounded"></div>
                      <div className="h-2 w-1/2 bg-muted animate-pulse rounded"></div>
                    </div>
                  ))}
                </div>
              ) : savedAddresses.length > 0 ? (
                savedAddresses.map((savedAddress) => (
                  <div
                    key={savedAddress.id}
                    onClick={() => handleSavedAddressSelect(savedAddress)}
                    className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#3a3a3a] transition-colors"
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">
                        {savedAddress.label}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {savedAddress.address}
                      </div>
                      {(savedAddress.bell_name || savedAddress.floor) && (
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                          {savedAddress.bell_name && (
                            <span>
                              Κουδούνι:{" "}
                              <span className="text-gray-300">
                                {savedAddress.bell_name}
                              </span>
                            </span>
                          )}
                          {savedAddress.floor && (
                            <span>
                              Όροφος:{" "}
                              <span className="text-gray-300">
                                {savedAddress.floor}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">
                  {lang === "el"
                    ? "Δεν έχετε αποθηκευμένες διευθύνσεις"
                    : "No saved addresses"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Address input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">
            {dict.locationModal.enterAddress}{" "}
            <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {lang === "el"
              ? "Συμπεριλάβετε τον ταχυδρομικό κώδικα (π.χ. 15342)"
              : "Include postal code (e.g. 15342)"}
          </p>
          <div className="relative">
            <GooglePlacesCustom
              value={address}
              onChange={handleAddressChange}
              onPlaceSelect={handleGooglePlaceSelect}
              placeholder={
                lang === "el" ? "π.χ. Υδρας 24, 15342" : "e.g. Ydras 24, 15342"
              }
              className="pr-20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="p-1 hover:bg-gray-600 rounded transition-colors"
                title={dict.locationModal.useCurrentLocation}
              >
                {isGettingLocation ? (
                  <Skeleton className="w-4 h-4 rounded" />
                ) : (
                  <Navigation className="w-4 h-4 text-primary" />
                )}
              </button>
              <MapPin className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Continue button */}
        <Button
          onClick={handleContinue}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
        >
          {dict.common.confirm}
        </Button>

        {/* Decorative illustration */}
        <div className="mt-8 flex justify-center">
          <div className="relative">

          </div>
        </div>
      </div>
    </div>
  );
}
