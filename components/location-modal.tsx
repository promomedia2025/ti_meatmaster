"use client";

import { X, MapPin, Loader2, Navigation } from "lucide-react";
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
import GooglePlacesAutocomplete from "./google-places-autocomplete";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet?: (coordinates: {
    latitude: number;
    longitude: number;
  }) => void;
  initialAddress?: string;
}

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

export function LocationModal({
  isOpen,
  onClose,
  onLocationSet,
  initialAddress,
}: LocationModalProps) {
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressList, setShowAddressList] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Load saved location when modal opens
  useEffect(() => {
    if (isOpen) {
      // If initialAddress is provided, use it
      if (initialAddress) {
        setAddress(initialAddress);
        console.log("📍 Using initial address:", initialAddress);
      } else {
        // Otherwise, load from localStorage
        const savedLocation = localStorage.getItem("userLocation");
        if (savedLocation) {
          try {
            const parsedLocation = JSON.parse(savedLocation);
            setAddress(parsedLocation.fullAddress);
            console.log(
              "📍 Loaded saved address in modal:",
              parsedLocation.fullAddress
            );
          } catch (error) {
            console.error("Error loading saved location:", error);
          }
        } else {
          // Clear address if no saved location and no initial address
          setAddress("");
        }
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
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        const response = await fetch(
          `/api/address-book?user_id=${userData.id}`,
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
                apiAddress.address ||
                apiAddress.full_address ||
                apiAddress.address_1,
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

  // Address autocomplete function
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=gr&limit=5&addressdetails=1`
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error searching addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle address input change
  const handleAddressChange = (value: string) => {
    setAddress(value);
    searchAddresses(value);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    console.log("📍 Selected address:", suggestion);
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

      // Reverse geocoding to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );

      if (response.ok) {
        const data = await response.json();
        const fullAddress = data.display_name;
        setAddress(fullAddress);
        console.log("📍 Autocompleted address:", fullAddress);
      }
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&countrycodes=gr&limit=1&addressdetails=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const result = data[0];
          return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
          };
        }
      }
      throw new Error("No coordinates found for address");
    } catch (error) {
      console.error("Error geocoding address:", error);
      throw error;
    }
  };

  const handleSavedAddressSelect = (savedAddress: SavedAddress) => {
    // Fill the input field with the selected address
    setAddress(savedAddress.address);
    setShowAddressList(false);

    // Hide suggestions when selecting a saved address
    setShowSuggestions(false);

    console.log("📍 Selected saved address:", savedAddress.address);
  };

  // Handle Google Places selection
  const handleGooglePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (place.formatted_address && place.geometry?.location) {
      const address = place.formatted_address;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      console.log("📍 Google Places selected:", { address, lat, lng });

      // Update the address input
      setAddress(address);

      // Hide suggestions
      setShowSuggestions(false);
      setShowAddressList(false);

      // Save location to localStorage
      const locationData = {
        city: address.split(",")[0] || address,
        fullAddress: address,
        coordinates: { latitude: lat, longitude: lng },
        addressDetails: {},
      };
      localStorage.setItem("userLocation", JSON.stringify(locationData));

      // Call the callback to update parent component
      if (onLocationSet) {
        onLocationSet({ latitude: lat, longitude: lng });
      }

      // Close the modal
      onClose();
    }
  };

  // Handle continue button click
  const handleContinue = async () => {
    if (!address.trim()) {
      alert("Please enter an address");
      return;
    }

    try {
      console.log("📍 Geocoding address:", address);
      const coordinates = await geocodeAddress(address);
      console.log("📍 Address coordinates:", coordinates);

      // Save location to localStorage
      const locationData = {
        city: address.split(",")[0] || address, // Use first part as city
        fullAddress: address,
        coordinates,
        addressDetails: {},
      };
      localStorage.setItem("userLocation", JSON.stringify(locationData));

      // Call the callback to update parent component
      if (onLocationSet) {
        onLocationSet(coordinates);
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error("Error processing address:", error);
      alert("Failed to process the address. Please try again.");
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
          Προσθήκη νέας διεύθυνσης
        </h2>

        {/* Country dropdown */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Χώρα</label>
          <Select defaultValue="greece">
            <SelectTrigger className="w-full bg-[#2a2a2a] border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-gray-600">
              <SelectItem value="greece" className="text-white">
                Ελλάδα
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Saved Addresses */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-gray-400">
              Αποθηκευμένες διευθύνσεις
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
              {showAddressList ? "Απόκρυψη" : "Εμφάνιση"}
            </button>
          </div>

          {showAddressList && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {loadingAddresses ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
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
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">
                  Δεν έχετε αποθηκευμένες διευθύνσεις
                </div>
              )}
            </div>
          )}
        </div>

        {/* Address input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">
            Οδός και αριθμός
          </label>
          <div className="relative">
            <GooglePlacesAutocomplete
              value={address}
              onChange={handleAddressChange}
              onPlaceSelect={handleGooglePlaceSelect}
              placeholder="Εισάγετε τη διεύθυνσή σας"
              className="pr-20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="p-1 hover:bg-gray-600 rounded transition-colors"
                title="Use current location"
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 text-primary" />
                )}
              </button>
              <MapPin className="w-4 h-4 text-gray-400" />
            </div>

            {/* Address suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-[#2a2a2a] border border-gray-600 rounded-md mt-1 max-h-48 overflow-y-auto z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-600 transition-colors border-b border-gray-700 last:border-b-0"
                  >
                    <div className="font-medium">
                      {suggestion.address.road}{" "}
                      {suggestion.address.house_number}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {suggestion.address.postcode} {suggestion.address.city}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute top-full left-0 right-0 bg-[#2a2a2a] border border-gray-600 rounded-md mt-1 p-3 text-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin mx-auto" />
                <div className="text-sm text-gray-400 mt-1">
                  Searching addresses...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Continue button */}
        <Button
          onClick={handleContinue}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3"
        >
          Συνέχεια
        </Button>

        {/* Decorative illustration */}
        <div className="mt-8 flex justify-center">
          <div className="relative">
            {/* Buildings illustration */}
            <svg
              width="200"
              height="120"
              viewBox="0 0 200 120"
              className="opacity-80"
            >
              {/* Sky and clouds */}
              <rect width="200" height="60" fill="#2a2a2a" />
              <ellipse
                cx="50"
                cy="20"
                rx="15"
                ry="8"
                fill="#4a9eff"
                opacity="0.6"
              />
              <ellipse
                cx="120"
                cy="15"
                rx="12"
                ry="6"
                fill="#4a9eff"
                opacity="0.6"
              />
              <ellipse
                cx="170"
                cy="25"
                rx="18"
                ry="9"
                fill="#4a9eff"
                opacity="0.6"
              />

              {/* Buildings */}
              <rect x="20" y="60" width="40" height="60" fill="#4ade80" />
              <rect x="20" y="60" width="40" height="10" fill="#22c55e" />
              <rect
                x="25"
                y="70"
                width="8"
                height="8"
                fill="#ffffff"
                opacity="0.8"
              />
              <rect
                x="37"
                y="70"
                width="8"
                height="8"
                fill="#ffffff"
                opacity="0.8"
              />
              <rect
                x="25"
                y="85"
                width="8"
                height="8"
                fill="#ffffff"
                opacity="0.8"
              />
              <rect
                x="37"
                y="85"
                width="8"
                height="8"
                fill="#ffffff"
                opacity="0.8"
              />

              <rect x="70" y="45" width="35" height="75" fill="#3b82f6" />
              <rect x="70" y="45" width="35" height="10" fill="#2563eb" />
              <rect
                x="75"
                y="60"
                width="6"
                height="6"
                fill="#ffffff"
                opacity="0.8"
              />
              <rect
                x="85"
                y="60"
                width="6"
                height="6"
                fill="#ffffff"
                opacity="0.8"
              />
              <rect
                x="95"
                y="60"
                width="6"
                height="6"
                fill="#ffffff"
                opacity="0.8"
              />

              <rect x="115" y="70" width="30" height="50" fill="#f97316" />
              <rect x="115" y="70" width="30" height="8" fill="#ea580c" />
              <rect
                x="120"
                y="85"
                width="6"
                height="6"
                fill="#ffffff"
                opacity="0.8"
              />
              <rect
                x="130"
                y="85"
                width="6"
                height="6"
                fill="#ffffff"
                opacity="0.8"
              />

              <rect x="155" y="55" width="35" height="65" fill="#06b6d4" />
              <rect x="155" y="55" width="35" height="10" fill="#0891b2" />
              <rect
                x="160"
                y="70"
                width="6"
                height="6"
                fill="#ffffff"
                opacity="0.8"
              />
              <rect
                x="170"
                y="70"
                width="6"
                height="6"
                fill="#ffffff"
                opacity="0.8"
              />
              <rect
                x="180"
                y="70"
                width="6"
                height="6"
                fill="#ffffff"
                opacity="0.8"
              />

              {/* Location pin */}
              <circle cx="175" cy="85" r="12" fill="#primary" />
              <circle cx="175" cy="85" r="8" fill="#ffffff" />
              <circle cx="175" cy="85" r="4" fill="#primary" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
