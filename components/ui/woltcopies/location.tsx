import { MapPin, ChevronDown, Loader2 } from "lucide-react";
import { useLocation } from "@/lib/location-context";
import { useAuth } from "@/lib/auth-context";

interface WoltLocationProps {
  onClick?: () => void;
  cityName?: string;
  isLoading?: boolean;
  dict?: any;
}

export function WoltLocation({
  onClick,
  cityName = "Location",
  isLoading = false,
  dict,
}: WoltLocationProps) {
  const {
    defaultAddress,
    coordinates,
    isTrackingLocation,
    locationError,
    formattedAddress,
    isGeocoding,
  } = useLocation();
  const { isAuthenticated } = useAuth();

  // Determine what to display based on user authentication status
  const getDisplayText = () => {
    // If user is logged in, prioritize automatic location tracking
    if (isAuthenticated) {
      if (isTrackingLocation) {
        return dict?.location?.trackingLocation || "Tracking location...";
      }
      if (isGeocoding) {
        return dict?.location?.gettingAddress || "Getting address...";
      }
      if (locationError) {
        return dict?.location?.locationUnavailable || "Location unavailable";
      }
      if (formattedAddress) {
        // Use the same formatting logic as woltnavbar.tsx line 144
        const street = formattedAddress.street || "";
        const postcode = formattedAddress.postcode || "";
        const city = formattedAddress.area || "";

        // Build display string: "Street HouseNumber, PostalCode, City"
        const parts = [];
        if (street) {
          parts.push(street);
        }
        if (postcode) {
          parts.push(postcode);
        }
        if (city) {
          parts.push(city);
        }

        const locationDisplay =
          parts.length > 0 ? parts.join(", ") : formattedAddress.fullAddress;

        return locationDisplay;
      }
      if (coordinates) {
        return `📍 ${coordinates.latitude.toFixed(
          4
        )}, ${coordinates.longitude.toFixed(4)}`;
      }
      return dict?.location?.enableLocation || "Enable location access";
    }

    // If user is not logged in, use default address or fallback
    if (defaultAddress) {
      return `${defaultAddress.address_1}, ${defaultAddress.city}, ${defaultAddress.postcode}`;
    }

    return cityName;
  };

  const displayText = getDisplayText();
  const showLoading = isLoading || isTrackingLocation || isGeocoding;

  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={onClick}>
      <div className="inline-flex relative justify-center items-center w-[40px] min-w-[40px] h-[40px] min-h-[40px] rounded-full transition-colors duration-[120ms] ease-out bg-[#60350F]">
        <MapPin size={24} color="#ff9328ff" />
      </div>
      <div className="flex items-center gap-1">
        {showLoading ? (
          <Loader2 className="w-4 h-4 text-[#ff9328ff] animate-spin" />
        ) : (
          <p className="text-sm text-[#ff9328ff] font-semibold">
            {displayText}
          </p>
        )}
      </div>
      <ChevronDown size={16} color="#ff9328ff" />
    </div>
  );
}
