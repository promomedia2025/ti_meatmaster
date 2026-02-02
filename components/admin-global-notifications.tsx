"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePusher } from "@/lib/pusher-context";
import { toast } from "sonner";
import {
  focusElectronWindow,
  isElectron,
  isWindowFocused,
} from "@/lib/electron-utils";
import { AdminOrderBanner } from "@/components/admin-order-banner";

interface AdminOrder {
  order_id: number;
  order_date?: string;
  order_time?: string;
  order_total?: string;
  currency?: string;
  status_id?: number;
  created_at?: string;
  location_name?: string;
  status_name?: string;
}

/**
 * Returns the full location name
 */
const formatLocationName = (locationName?: string) => {
  // Always return the full location_name
  return locationName || "";
};

/**
 * Global notification component for admin panel
 * Handles realtime order notifications across all admin pages
 */
export function AdminGlobalNotifications() {
  const router = useRouter();
  const { pusher, subscribe, unsubscribe, isConnected } = usePusher();
  const [bannerOrder, setBannerOrder] = useState<AdminOrder | null>(null);

  /**
   * Plays notification sound and focuses Electron window if available
   */
  const playNotificationSound = () => {

    if (typeof window === "undefined") {
      return;
    }

    // Check Electron and focus window
    const electronDetected = isElectron();
    const windowFocused = isWindowFocused();


    // Focus and restore Electron window when notification sound plays
    if (electronDetected) {
      focusElectronWindow();
    }

    // Try Electron API first, fallback to browser audio
    if (electronDetected && window.electron?.playNotificationSound) {
      try {
        window.electron.playNotificationSound();
        return;
      } catch (error) {
        // Electron API failed, falling back to browser
      }
    }

    // Fallback to browser audio
    try {
      const audio = new Audio("/phone-ringtone-normal-444775.mp3");
      audio.volume = 0.7; // Set volume to 70%
      audio.play().catch(() => {
        // Failed to play notification sound
      });
    } catch (error) {
      // Error creating audio
    }
  };

  /**
   * Shows toast notification for new order
   */
  const showOrderCreatedToast = (order: AdminOrder) => {
    toast.success("Νέα Παραγγελία", {
      description: `Παραγγελία #${order.order_id} από ${
        formatLocationName(order.location_name) || "άγνωστη τοποθεσία"
      }`,
      action: {
        label: "Προβολή",
        onClick: () => {
          // Navigate to admin dashboard to view the order
          router.push("/admin");
        },
      },
      duration: 6000,
    });
  };

  // Subscribe to admin.orders channel for real-time updates
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const channelName = "admin.orders";

    const channel = subscribe(channelName);

    if (!channel) {
      return;
    }


    // Listen for successful subscription
    channel.bind("pusher:subscription_succeeded", () => {
      // Successfully subscribed
    });

    // Listen for subscription errors
    channel.bind("pusher:subscription_error", (error: any) => {
      // Failed to subscribe
    });

    const handleOrderCreated = (data: any) => {

      const order = data.order || data;

      if (!order || !order.order_id) {
        return;
      }


      // Play sound and show toast with order info from event
      playNotificationSound();
      showOrderCreatedToast(order);
      
      // Show banner notification
      setBannerOrder(order);

      // Emit custom event for pages that want to refresh their data
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("admin:order-created", { detail: order })
        );
      }
    };

    const orderCreatedEvents = ["order.created", "orderCreated"];
    orderCreatedEvents.forEach((eventName) =>
      channel.bind(eventName, handleOrderCreated)
    );

    const handleOrderUpdated = (data: any) => {

      const order = data.order || data;

      if (!order || !order.order_id) {
        return;
      }

      
      // Emit custom event for pages that want to refresh their data
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("admin:order-updated", { detail: order })
        );
      }
    };

    channel.bind("order.updated", handleOrderUpdated);

    const handleOrderStatusChanged = (data: any) => {

      if (!data.order_id) {
        return;
      }

      
      // Emit custom event for pages that want to refresh their data
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("admin:order-status-changed", { detail: data })
        );
      }
    };

    channel.bind("order.status.changed", handleOrderStatusChanged);

    const handleOrderDeleted = (data: any) => {

      if (data.order_id) {
        
        // Emit custom event for pages that want to refresh their data
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("admin:order-deleted", { detail: data })
          );
        }
      }
    };

    channel.bind("order.deleted", handleOrderDeleted);


    return () => {

      orderCreatedEvents.forEach((eventName) =>
        channel.unbind(eventName, handleOrderCreated)
      );
      channel.unbind("order.updated", handleOrderUpdated);
      channel.unbind("order.status.changed", handleOrderStatusChanged);
      channel.unbind("order.deleted", handleOrderDeleted);

      unsubscribe(channelName);
    };
  }, [isConnected, subscribe, unsubscribe, router]);

  return (
    <>
      <AdminOrderBanner
        order={bannerOrder}
        onDismiss={() => setBannerOrder(null)}
        onView={() => {
          router.push("/admin");
          setBannerOrder(null);
        }}
      />
    </>
  );
}

