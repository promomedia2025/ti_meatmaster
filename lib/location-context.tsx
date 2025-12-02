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

  const fetchDefaultAddress = async (customerId: number) => {
    try {
      const response = await fetch(
        `https://cocofino.bettersolution.gr/api/address-book/${customerId}?default=true`
      );

      if (response.ok) {
        const data = await response.json();
        if (
          data.success &&
          data.data.addresses &&
          data.data.addresses.length > 0
        ) {
          const address = data.data.addresses[0];
          setDefaultAddress(address);
        }
      }
    } catch (error) {
      console.error("Error fetching default address:", error);
    }
  };

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
          setFormattedAddress(address);
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

  const refreshAddress = useCallback(
    async (lang: string) => {
      if (coordinates) {
        const address = await reverseGeocode(
          coordinates.latitude,
          coordinates.longitude,
          lang
        );
        if (address) {
          setFormattedAddress(address);
        }
      }
    },
    [coordinates, reverseGeocode]
  );

  // Auto-start location tracking when user logs in (only if no manual address is set)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Only start automatic tracking if no manual address has been set
      if (!formattedAddress) {
        startLocationTracking();
      }
    } else {
      stopLocationTracking();
      setCoordinates(null);
    }
  }, [isAuthenticated, user?.id, formattedAddress]);

  return (
    <LocationContext.Provider
      value={{
        coordinates,
        setCoordinates,
        defaultAddress,
        setDefaultAddress,
        fetchDefaultAddress,
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
