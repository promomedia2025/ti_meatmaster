"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { usePathname } from "next/navigation";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

interface GooglePlacesCustomProps {
  onPlaceSelect: (place: any) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

interface Prediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function GooglePlacesCustom({
  onPlaceSelect,
  placeholder = "Enter address...",
  className = "",
  value = "",
  onChange,
}: GooglePlacesCustomProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const urlLocale = (pathname.split("/")[1] || "el").toLowerCase();
  const language = ["el", "en"].includes(urlLocale) ? urlLocale : "el";

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        await loadGoogleMaps(language);

        // Initialize services
        autocompleteServiceRef.current = new (
          window as any
        ).google.maps.places.AutocompleteService();

        // Create a hidden div for PlacesService (it requires a map or div)
        const div = document.createElement("div");
        placesServiceRef.current = new (
          window as any
        ).google.maps.places.PlacesService(div);

        setIsLoaded(true);
        setError(null);
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError("Failed to load Google Maps");
      }
    };

    initializeGoogleMaps();
  }, [language]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }

    if (newValue.length >= 3 && autocompleteServiceRef.current) {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: newValue,
          componentRestrictions: { country: "gr" },
          types: ["address"],
        },
        (predictions: any, status: any) => {
          if (status === "OK" && predictions) {
            setPredictions(predictions);
            setShowDropdown(true);
          } else {
            setPredictions([]);
            setShowDropdown(false);
          }
        }
      );
    } else {
      setPredictions([]);
      setShowDropdown(false);
    }
  };

  const handleSelectPrediction = (placeId: string) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: ["formatted_address", "geometry", "address_components", "name"],
      },
      (place: any, status: any) => {
        if (status === "OK" && place) {
          console.log("📍 Google Places selected:", place);
          onPlaceSelect(place);
          setShowDropdown(false);
          setPredictions([]);
        }
      }
    );
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
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors ${className}`}
        autoComplete="off"
      />
      {!isLoaded && !error && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Custom dropdown with postal codes */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-[#2a2a2a] border border-gray-600 rounded-lg mt-1 max-h-64 overflow-y-auto z-[9999] shadow-lg">
          {predictions.map((prediction) => {
            // Extract postal code from secondary text if available
            const secondaryText =
              prediction.structured_formatting.secondary_text || "";
            const mainText =
              prediction.structured_formatting.main_text ||
              prediction.description;

            return (
              <button
                key={prediction.place_id}
                onClick={() => handleSelectPrediction(prediction.place_id)}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-600 transition-colors border-b border-gray-700 last:border-b-0 flex items-start gap-3"
              >
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{mainText}</div>
                  {secondaryText && (
                    <div className="text-gray-400 text-xs mt-1">
                      {secondaryText}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Powered by Google logo */}
          <div className="py-2 px-4 border-t border-gray-700 flex justify-center">
            <img
              src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white.png"
              alt="Powered by Google"
              className="h-4 opacity-80"
            />
          </div>
        </div>
      )}
    </div>
  );
}
