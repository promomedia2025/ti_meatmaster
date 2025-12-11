"use client";

import { useEffect, useState } from "react";
import { useLocation } from "@/lib/location-context";
import {
  useDeliveryAvailability,
  type DeliveryAvailabilityData,
} from "@/lib/delivery-availability-context";
import { toast } from "sonner";

interface DeliveryAvailabilityCheckerProps {
  locationId: number;
  deliveryAvailable?: boolean;
}

export function DeliveryAvailabilityChecker({
  locationId,
  deliveryAvailable = true,
}: DeliveryAvailabilityCheckerProps) {
  const { coordinates } = useLocation();
  const { setDeliveryData } = useDeliveryAvailability();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkDeliveryAvailability = async () => {
      if (!coordinates || !locationId || isChecking || !deliveryAvailable) {
        if (!deliveryAvailable) {
          console.log(
            "🛒 [DELIVERY CHECKER] Skipping check - delivery not available for location",
            locationId
          );
        }
        return;
      }

      setIsChecking(true);

      try {
        const response = await fetch(
          `/api/locations/${locationId}/delivery-availability?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`
        );

        const data = await response.json();

        if (data.success && data.data) {
          // Store delivery data in context
          setDeliveryData(locationId, data.data);

          // Show warning if delivery is not available
          if (!data.data.is_delivery_available) {
            if (data.data.is_within_delivery_area && !data.data.delivery_enabled) {
              toast.warning(
                "Η παράδοση δεν είναι ενεργή για αυτήν την τοποθεσία",
                {
                  description: `Απόσταση: ${data.data.distance.kilometers.toFixed(2)} km`,
                }
              );
            } else if (!data.data.is_within_delivery_area) {
              toast.error(
                "Η διεύθυνσή σας είναι εκτός περιοχής παράδοσης",
                {
                  description: `Απόσταση: ${data.data.distance.kilometers.toFixed(2)} km`,
                }
              );
            }
          }
        } else {
          console.error("Failed to check delivery availability:", data.message);
        }
      } catch (error) {
        console.error("Error checking delivery availability:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkDeliveryAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates?.latitude, coordinates?.longitude, locationId]);

  // This component doesn't render anything visible
  // It just checks delivery availability in the background
  return null;
}

