import { MapPin, ChevronDown, Loader2, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "@/lib/location-context";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

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
        return formattedAddress.fullAddress;
      }
    }

    // If user is not logged in, always show click to enter address message
    return (
      dict?.location?.clickToEnterAddress ||
      "Πατήστε για να εισάγετε τη διεύθυνσή σας"
    );
  };

  const displayText = getDisplayText();
  const showLoading = isLoading || isTrackingLocation || isGeocoding;
  const [showTooltip, setShowTooltip] = useState(false);

  // Check if we're displaying the default address
  // We show the badge only if:
  // 1. Default address exists
  // 2. We have coordinates
  // 3. The coordinates match the default address coordinates (within small tolerance)
  const isDefaultAddress = (() => {
    if (
      !defaultAddress ||
      !formattedAddress ||
      !isAuthenticated ||
      !coordinates
    ) {
      return false;
    }

    // If default address has coordinates, compare them
    if (
      defaultAddress.coordinates?.latitude &&
      defaultAddress.coordinates?.longitude
    ) {
      const defaultLat = parseFloat(defaultAddress.coordinates.latitude);
      const defaultLng = parseFloat(defaultAddress.coordinates.longitude);
      const currentLat = coordinates.latitude;
      const currentLng = coordinates.longitude;

      // Check if coordinates match within a small tolerance (0.0001 degrees ≈ 11 meters)
      const tolerance = 0.0001;
      const latMatch = Math.abs(defaultLat - currentLat) < tolerance;
      const lngMatch = Math.abs(defaultLng - currentLng) < tolerance;

      return latMatch && lngMatch;
    }

    // If default address doesn't have coordinates, we can't verify it's the default
    // So don't show the badge
    return false;
  })();

  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={onClick}>
      <div className="inline-flex relative justify-center items-center w-[40px] min-w-[40px] h-[40px] min-h-[40px] rounded-full transition-colors duration-[120ms] ease-out bg-[#FFFFFF]">
        <MapPin size={24} color="rgb(104, 104, 104)" />
      </div>
      <div className="flex items-center gap-1">
        {showLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
            <p className="text-sm text-[#FFFFFF] font-semibold">
            {displayText}
          </p>
        )}
      </div>
      {isDefaultAddress && !showLoading && (
        <div
          className="relative flex items-center"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
            <CheckCircle2 size={14} className="text-green-400" />
            <span className="text-xs font-medium text-green-400">
              Προεπιλεγμένη
            </span>
          </div>
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg border border-gray-700 whitespace-nowrap z-50">
              Προεπιλεγμένη διεύθυνση
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      )}
      <ChevronDown size={16} color="#FFFFFF" />
    </div>
  );
}
