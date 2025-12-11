"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

export interface DeliveryAvailabilityData {
  is_delivery_available: boolean;
  is_within_delivery_area: boolean;
  delivery_enabled: boolean;
  distance: {
    kilometers: number;
    miles: number;
  };
}

interface DeliveryAvailabilityContextType {
  deliveryData: Map<number, DeliveryAvailabilityData>;
  setDeliveryData: (locationId: number, data: DeliveryAvailabilityData) => void;
  getDeliveryData: (locationId: number) => DeliveryAvailabilityData | null;
  isDeliveryBlocked: (locationId: number) => boolean;
}

const DeliveryAvailabilityContext = createContext<
  DeliveryAvailabilityContextType | undefined
>(undefined);

export function DeliveryAvailabilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [deliveryData, setDeliveryDataState] = useState<
    Map<number, DeliveryAvailabilityData>
  >(new Map());

  const setDeliveryData = useCallback(
    (locationId: number, data: DeliveryAvailabilityData) => {
      setDeliveryDataState((prev) => {
        const newMap = new Map(prev);
        newMap.set(locationId, data);
        return newMap;
      });
    },
    []
  );

  const getDeliveryData = useCallback(
    (locationId: number): DeliveryAvailabilityData | null => {
      return deliveryData.get(locationId) || null;
    },
    [deliveryData]
  );

  const isDeliveryBlocked = useCallback(
    (locationId: number): boolean => {
      const data = deliveryData.get(locationId);
      if (!data) {
        return false; // If no data, don't block (assume available)
      }
      // Block if delivery is enabled but user is outside delivery area
      return data.delivery_enabled && !data.is_within_delivery_area;
    },
    [deliveryData]
  );

  return (
    <DeliveryAvailabilityContext.Provider
      value={{
        deliveryData,
        setDeliveryData,
        getDeliveryData,
        isDeliveryBlocked,
      }}
    >
      {children}
    </DeliveryAvailabilityContext.Provider>
  );
}

export function useDeliveryAvailability() {
  const context = useContext(DeliveryAvailabilityContext);
  if (context === undefined) {
    throw new Error(
      "useDeliveryAvailability must be used within a DeliveryAvailabilityProvider"
    );
  }
  return context;
}



