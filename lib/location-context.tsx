"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./auth-context";

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface DefaultAddress {
  id: number;
  customer_id: number;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: {
    id: number;
    name: string;
    iso_code_2: string;
    iso_code_3: string;
  };
  formatted_address: string;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface FormattedAddress {
  street: string;
  area: string;
  postcode: string;
  fullAddress: string;
  bell_name?: string | null;
  floor?: string | null;
}

interface LocationContextType {
  coordinates: LocationCoordinates | null;
  setCoordinates: (coords: LocationCoordinates | null) => void;
  defaultAddress: DefaultAddress | null;
  setDefaultAddress: (address: DefaultAddress | null) => void;
  fetchDefaultAddress: (customerId: number) => Promise<void>;
  isTrackingLocation: boolean;
  locationError: string | null;
  startLocationTracking: (lang?: string) => void;
  stopLocationTracking: () => void;
  formattedAddress: FormattedAddress | null;
  isGeocoding: boolean;
  reverseGeocode: (
    lat: number,
    lng: number,
    lang?: string
  ) => Promise<FormattedAddress | null>;
  setFormattedAddress: (address: FormattedAddress | null) => void;
  refreshAddress: (lang: string) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(
    null
  );
  const [defaultAddress, setDefaultAddress] = useState<DefaultAddress | null>(
    null
  );
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [formattedAddress, setFormattedAddress] =
    useState<FormattedAddress | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Reverse geocode: convert coordinates to formatted address
  const reverseGeocode = useCallback(
    async (
      lat: number,
      lng: number,
      lang: string = "el"
    ): Promise<FormattedAddress | null> => {
      try {
        setIsGeocoding(true);

        // Use Google Geocoding API for reverse geocoding
        const response = await fetch(
          `/api/geocode?lat=${lat}&lon=${lng}&lang=${lang}`
        );

        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.success && data.data && data.data.address) {
          const address = data.data.address;

          // Extract address components for Greek format
          const streetName = address.road || address.street || "";
          const houseNumber = address.house_number || "";
          const city = address.city || address.town || address.village || "";
          const postcode = address.postcode || "";

          // Format: "Οδός Αριθμός, ΤΚ, Πόλη"
          const street = [streetName, houseNumber].filter(Boolean).join(" ");
          const fullAddress = [street, postcode, city]
            .filter(Boolean)
            .join(", ");

          const formattedAddress: FormattedAddress = {
            street: street || "Δεν βρέθηκε οδός",
            area: city || "Δεν βρέθηκε περιοχή",
            postcode: postcode || "",
            fullAddress: fullAddress || "Δεν βρέθηκε διεύθυνση",
          };

          return formattedAddress;
        }

        return null;
      } catch (error) {
        console.error("❌ Reverse geocoding error:", error);
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    []
  );

  // Forward geocode: convert address string to coordinates
  const forwardGeocode = useCallback(
    async (
      addressString: string,
      lang: string = "el"
    ): Promise<LocationCoordinates | null> => {
      try {
        console.log(
          "📍 [FORWARD GEOCODE] Starting forward geocoding for address:",
          addressString
        );
        setIsGeocoding(true);

        const response = await fetch(
          `/api/geocode?address=${encodeURIComponent(
            addressString
          )}&lang=${lang}`
        );

        if (!response.ok) {
          throw new Error(`Forward geocoding failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("📍 [FORWARD GEOCODE] API response:", data);

        if (data && data.success && data.data && data.data.length > 0) {
          const firstResult = data.data[0];
          const coords = {
            latitude: parseFloat(firstResult.lat),
            longitude: parseFloat(firstResult.lon),
          };
          console.log("📍 [FORWARD GEOCODE] ✅ Coordinates found:", coords);
          return coords;
        }

        console.log("📍 [FORWARD GEOCODE] ⚠️ No coordinates found for address");
        return null;
      } catch (error) {
        console.error(
          "📍 [FORWARD GEOCODE] ❌ Error during forward geocoding:",
          error
        );
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    []
  );

  const fetchDefaultAddress = useCallback(
    async (customerId: number) => {
      console.log(
        "📍 [ADDRESS FETCH] Starting to fetch default address for customer:",
        customerId
      );
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const apiUrl = `${baseUrl}/api/address-book/${customerId}?default=true`;
        console.log("📍 [ADDRESS FETCH] API URL:", apiUrl);

        const response = await fetch(apiUrl);
        console.log(
          "📍 [ADDRESS FETCH] Response status:",
          response.status,
          response.ok
        );

        if (response.ok) {
          const data = await response.json();
          console.log("📍 [ADDRESS FETCH] API response data:", data);

          if (
            data.success &&
            data.data.addresses &&
            data.data.addresses.length > 0
          ) {
            const address = data.data.addresses[0];
            console.log("📍 [ADDRESS FETCH] ✅ Default address found:", {
              id: address.id,
              address_1: address.address_1,
              city: address.city,
              postcode: address.postcode,
              formatted_address: address.formatted_address,
              has_coordinates: !!(
                address.coordinates &&
                address.coordinates.latitude &&
                address.coordinates.longitude
              ),
            });

            setDefaultAddress(address);

            let coords: LocationCoordinates | null = null;

            // Check if coordinates are available in the address
            if (
              address.coordinates &&
              address.coordinates.latitude &&
              address.coordinates.longitude
            ) {
              coords = {
                latitude: parseFloat(address.coordinates.latitude),
                longitude: parseFloat(address.coordinates.longitude),
              };
              console.log(
                "📍 [ADDRESS FETCH] Using coordinates from address:",
                coords
              );
            } else {
              // No coordinates available, use forward geocoding to get them
              console.log(
                "📍 [ADDRESS FETCH] ⚠️ No coordinates in address, attempting forward geocoding..."
              );

              // Build address string for geocoding
              const addressParts = [
                address.address_1,
                address.address_2,
                address.city,
                address.postcode,
                address.country?.name || "Greece",
              ].filter(Boolean);
              const addressString = addressParts.join(", ");

              console.log(
                "📍 [ADDRESS FETCH] Geocoding address string:",
                addressString
              );
              coords = await forwardGeocode(addressString);

              if (coords) {
                console.log(
                  "📍 [ADDRESS FETCH] ✅ Successfully geocoded address to coordinates:",
                  coords
                );
              } else {
                console.log(
                  "📍 [ADDRESS FETCH] ❌ Failed to geocode address, coordinates not available"
                );
              }
            }

            // If we have coordinates (either from address or geocoding), set them and reverse geocode
            if (coords) {
              setCoordinates(coords);

              // Use reverse geocoding to get properly formatted address
              const formatted = await reverseGeocode(
                coords.latitude,
                coords.longitude,
                "el"
              );
              if (formatted) {
                // Preserve bell_name and floor from the original address
                const formattedWithExtras: FormattedAddress = {
                  ...formatted,
                  bell_name: address.bell_name || null,
                  floor: address.floor || null,
                };
                console.log(
                  "📍 [ADDRESS FETCH] Setting formatted address from reverse geocoding (with bell_name & floor):",
                  formattedWithExtras
                );
                setFormattedAddress(formattedWithExtras);
              } else {
                // Fallback to address data if reverse geocoding fails
                const formatted: FormattedAddress = {
                  street: address.address_1 || "",
                  area: address.city || "",
                  postcode: address.postcode || "",
                  fullAddress:
                    address.formatted_address ||
                    `${address.address_1}, ${address.city} ${address.postcode}`,
                  bell_name: address.bell_name || null,
                  floor: address.floor || null,
                };
                console.log(
                  "📍 [ADDRESS FETCH] Setting formatted address from address data (fallback):",
                  formatted
                );
                setFormattedAddress(formatted);
              }
            } else {
              // No coordinates available at all, just set formatted address from address data
              const formatted: FormattedAddress = {
                street: address.address_1 || "",
                area: address.city || "",
                postcode: address.postcode || "",
                fullAddress:
                  address.formatted_address ||
                  `${address.address_1}, ${address.city} ${address.postcode}`,
                bell_name: address.bell_name || null,
                floor: address.floor || null,
              };
              console.log(
                "📍 [ADDRESS FETCH] Setting formatted address from address data (no coordinates):",
                formatted
              );
              setFormattedAddress(formatted);
            }
          } else {
            console.log(
              "📍 [ADDRESS FETCH] ℹ️ No default address found for customer"
            );
          }
        } else {
          console.log(
            "📍 [ADDRESS FETCH] ❌ API response not OK, status:",
            response.status
          );
        }
      } catch (error) {
        console.error(
          "📍 [ADDRESS FETCH] ❌ Error fetching default address:",
          error
        );
      }
    },
    [forwardGeocode, reverseGeocode]
  );

  const startLocationTracking = (lang: string = "el") => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    setIsTrackingLocation(true);
    setLocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoordinates(coords);
        setIsTrackingLocation(false);

        // Automatically reverse geocode the coordinates
        const address = await reverseGeocode(
          coords.latitude,
          coords.longitude,
          lang
        );
        if (address) {
          // Preserve bell_name and floor from defaultAddress if it exists
          const addressWithExtras: FormattedAddress = {
            ...address,
            bell_name: defaultAddress?.bell_name || null,
            floor: defaultAddress?.floor || null,
          };
          setFormattedAddress(addressWithExtras);
        }
      },
      (error) => {
        setIsTrackingLocation(false);
        let errorMessage = "Unable to retrieve your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        setLocationError(errorMessage);
      },
      options
    );
  };

  const stopLocationTracking = () => {
    setIsTrackingLocation(false);
    setLocationError(null);
  };

  const refreshAddress = useCallback(
    async (lang: string) => {
      if (coordinates) {
        const address = await reverseGeocode(
          coordinates.latitude,
          coordinates.longitude,
          lang
        );
        if (address) {
          // Preserve bell_name and floor from defaultAddress if it exists
          const addressWithExtras: FormattedAddress = {
            ...address,
            bell_name: defaultAddress?.bell_name || null,
            floor: defaultAddress?.floor || null,
          };
          setFormattedAddress(addressWithExtras);
        }
      }
    },
    [coordinates, reverseGeocode, defaultAddress]
  );

  // Fetch default address when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id && !defaultAddress) {
      console.log(
        "📍 [ADDRESS FETCH] User logged in, triggering default address fetch for user:",
        user.id
      );
      fetchDefaultAddress(user.id);
    } else if (isAuthenticated && user?.id && defaultAddress) {
      console.log(
        "📍 [ADDRESS FETCH] User logged in but default address already exists, skipping fetch"
      );
    }
  }, [isAuthenticated, user?.id, defaultAddress, fetchDefaultAddress]);

  // Expose a function to manually refresh the default address (for when user sets a new default)
  const refreshDefaultAddress = useCallback(async () => {
    if (isAuthenticated && user?.id) {
      console.log(
        "📍 [ADDRESS FETCH] Manually refreshing default address for user:",
        user.id
      );
      // Clear existing default address to force re-fetch
      setDefaultAddress(null);
      await fetchDefaultAddress(user.id);
    }
  }, [isAuthenticated, user?.id, fetchDefaultAddress]);

  // Note: Auto-start location tracking removed - location detection now only happens
  // when user explicitly clicks the button in the location modal

  return (
    <LocationContext.Provider
      value={{
        coordinates,
        setCoordinates,
        defaultAddress,
        setDefaultAddress,
        fetchDefaultAddress,
        refreshDefaultAddress,
        isTrackingLocation,
        locationError,
        startLocationTracking,
        stopLocationTracking,
        formattedAddress,
        isGeocoding,
        reverseGeocode,
        setFormattedAddress,
        refreshAddress,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
