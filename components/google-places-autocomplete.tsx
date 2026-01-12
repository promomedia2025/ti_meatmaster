"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function GooglePlacesAutocomplete({
  onPlaceSelect,
  placeholder = "Enter address...",
  className = "",
  value = "",
  onChange,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const urlLocale = (pathname.split("/")[1] || "el").toLowerCase();
  const language = ["el", "en"].includes(urlLocale) ? urlLocale : "el";

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        await loadGoogleMaps(language);
        setIsLoaded(true);
        setError(null);
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError("Failed to load Google Maps");
      }
    };

    initializeGoogleMaps();
  }, [language]);

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      // Create autocomplete instance
      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "gr" }, // Restrict to Greece
          fields: [
            "place_id",
            "formatted_address",
            "geometry",
            "address_components",
            "name",
            "adr_address", // Includes postal code in display
          ],
        }
      );

      // Style the autocomplete container
      const pacContainer = document.querySelector(
        ".pac-container"
      ) as HTMLElement;
      if (pacContainer) {
        pacContainer.style.zIndex = "1000";
      }

      // Listen for place selection
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();

        if (place && place.geometry && place.geometry.location) {
          console.log("📍 Google Places selected:", place);
          onPlaceSelect(place);
        }
      });
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, onPlaceSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
  };

  if (error) {
    return (
      <div
        className={`p-3 bg-red-900/20 border border-red-500/30 rounded-lg ${className}`}
      >
        <p className="text-red-400 text-sm">
          {error === "Google Maps API key not configured"
            ? "Please configure your Google Maps API key in .env file"
            : "Google Maps failed to load. Falling back to manual input."}
        </p>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full mt-2 px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={isLoaded ? placeholder : "Loading Google Maps..."}
        disabled={!isLoaded}
        className={`w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary disabled:opacity-50 transition-colors ${className}`}
      />
      {!isLoaded && !error && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="h-4 w-4 rounded bg-muted animate-pulse"></div>
        </div>
      )}
      {isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
