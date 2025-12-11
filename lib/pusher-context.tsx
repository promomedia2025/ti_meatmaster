"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import Pusher from "pusher-js";

interface PusherContextType {
  pusher: Pusher | null;
  isConnected: boolean;
  subscribe: (channelName: string) => any;
  unsubscribe: (channelName: string) => void;
}

const PusherContext = createContext<PusherContextType | undefined>(undefined);

interface PusherProviderProps {
  children: ReactNode;
}

export function PusherProvider({ children }: PusherProviderProps) {
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize Pusher client
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu",
      encrypted: true,
      authEndpoint: "/api/pusher/auth", // For private channels if needed
    });

    // Set up connection event listeners
    pusherClient.connection.bind("connected", () => {
      setIsConnected(true);
    });

    pusherClient.connection.bind("disconnected", () => {
      setIsConnected(false);
    });

    pusherClient.connection.bind("error", (error: any) => {
      setIsConnected(false);
    });

    setPusher(pusherClient);

    // Cleanup on unmount
    return () => {
      pusherClient.disconnect();
    };
  }, []);

  const subscribe = (channelName: string) => {
    if (!pusher) {
      return null;
    }

    return pusher.subscribe(channelName);
  };

  const unsubscribe = (channelName: string) => {
    if (!pusher) {
      return;
    }

    pusher.unsubscribe(channelName);
  };

  const value: PusherContextType = {
    pusher,
    isConnected,
    subscribe,
    unsubscribe,
  };

  return (
    <PusherContext.Provider value={value}>{children}</PusherContext.Provider>
  );
}

// Custom hook to use Pusher context
export function usePusher(): PusherContextType {
  const context = useContext(PusherContext);
  if (context === undefined) {
    throw new Error("usePusher must be used within a PusherProvider");
  }
  return context;
}

// Custom hook for restaurant updates
export function useRestaurantUpdates() {
  const { subscribe, unsubscribe, isConnected } = usePusher();
  const [restaurants, setRestaurants] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to restaurant updates channel
    const channel = subscribe("restaurant-updates");

    if (channel) {
      // Listen for restaurant status updates
      channel.bind("restaurant-status-changed", (data: any) => {
        console.log("🍽️ Restaurant status updated:", data);
        setRestaurants((prev) =>
          prev.map((restaurant) =>
            restaurant.id === data.restaurantId
              ? { ...restaurant, ...data.updates }
              : restaurant
          )
        );
      });

      // Listen for new restaurants
      channel.bind("restaurant-added", (data: any) => {
        console.log("🍽️ New restaurant added:", data);
        setRestaurants((prev) => [...prev, data.restaurant]);
      });

      // Listen for restaurant removals
      channel.bind("restaurant-removed", (data: any) => {
        console.log("🍽️ Restaurant removed:", data);
        setRestaurants((prev) =>
          prev.filter((restaurant) => restaurant.id !== data.restaurantId)
        );
      });

      // Listen for menu updates
      channel.bind("menu-updated", (data: any) => {
        console.log("📋 Menu updated:", data);
        setRestaurants((prev) =>
          prev.map((restaurant) =>
            restaurant.id === data.restaurantId
              ? { ...restaurant, menu: data.menu }
              : restaurant
          )
        );
      });
    }

    return () => {
      unsubscribe("restaurant-updates");
    };
  }, [isConnected, subscribe, unsubscribe]);

  return { restaurants, setRestaurants };
}

// Custom hook for order updates
export function useOrderUpdates() {
  const { subscribe, unsubscribe, isConnected } = usePusher();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to order updates channel
    const channel = subscribe("order-updates");

    if (channel) {
      // Listen for order status updates
      channel.bind("order-status-changed", (data: any) => {
        console.log("📦 Order status updated:", data);
        setOrders((prev) =>
          prev.map((order) =>
            order.id === data.orderId
              ? { ...order, status: data.status, ...data.updates }
              : order
          )
        );
      });

      // Listen for new orders
      channel.bind("order-created", (data: any) => {
        console.log("📦 New order created:", data);
        setOrders((prev) => [...prev, data.order]);
      });
    }

    return () => {
      unsubscribe("order-updates");
    };
  }, [isConnected, subscribe, unsubscribe]);

  return { orders, setOrders };
}
