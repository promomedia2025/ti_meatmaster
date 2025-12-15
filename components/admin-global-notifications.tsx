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
 * Formats location name by removing duplicate commas and last 2 parts
 */
const formatLocationName = (locationName?: string) => {
  if (!locationName) return locationName;
  // Remove duplicate commas (replace multiple commas with single comma)
  const cleaned = locationName.replace(/,+/g, ",");
  // Split into array
  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part);
  // Remove last 2 indices
  if (parts.length > 2) {
    parts.splice(-2);
  }
  // Join back to string
  return parts.join(", ");
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
    console.log("🔔 [GlobalNotifications] playNotificationSound: Function called");

    if (typeof window === "undefined") {
      console.warn("⚠️ [GlobalNotifications] playNotificationSound: window is undefined");
      return;
    }

    // Check Electron and focus window
    const electronDetected = isElectron();
    const windowFocused = isWindowFocused();

    console.log("🔔 [GlobalNotifications] playNotificationSound: Electron check", {
      isElectron: electronDetected,
      isWindowFocused: windowFocused,
      hasWindowElectron: !!(typeof window !== "undefined" && window.electron),
    });

    // Focus and restore Electron window when notification sound plays
    if (electronDetected) {
      console.log(
        "🔔 [GlobalNotifications] playNotificationSound: Electron detected, calling focusElectronWindow()"
      );
      focusElectronWindow();
    } else {
      console.log(
        "ℹ️ [GlobalNotifications] playNotificationSound: Electron not detected, skipping window focus"
      );
    }

    try {
      console.log("🔔 [GlobalNotifications] playNotificationSound: Playing audio");
      const audio = new Audio("/phone-ringtone-normal-444775.mp3");
      audio.volume = 0.7; // Set volume to 70%
      audio
        .play()
        .then(() => {
          console.log("✅ [GlobalNotifications] playNotificationSound: Audio playback started");
        })
        .catch((error) => {
          console.warn(
            "🔇 [GlobalNotifications] playNotificationSound: Failed to play notification sound",
            error
          );
        });
    } catch (error) {
      console.warn("🔇 [GlobalNotifications] playNotificationSound: Error creating audio", error);
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
      console.log("⚠️ [GlobalNotifications] Pusher not connected yet, waiting...");
      return;
    }

    const channelName = "admin.orders";
    console.log(`📡 [GlobalNotifications] Attempting to subscribe to channel: ${channelName}`);
    console.log(
      `📡 [GlobalNotifications] Connection state - isConnected: ${isConnected}`
    );

    const channel = subscribe(channelName);

    if (!channel) {
      console.error(`❌ [GlobalNotifications] Failed to create channel: ${channelName}`);
      return;
    }

    console.log(`✅ [GlobalNotifications] Channel object created for ${channelName}`);

    // Listen for successful subscription
    channel.bind("pusher:subscription_succeeded", () => {
      console.log(`✅✅✅ [GlobalNotifications] Successfully subscribed to ${channelName}`);
      console.log(
        `📊 [GlobalNotifications] Channel state - subscribed: ${channel.subscribed}`
      );
    });

    // Listen for subscription errors
    channel.bind("pusher:subscription_error", (error: any) => {
      console.error(`❌ [GlobalNotifications] Failed to subscribe to ${channelName}:`, error);
      console.error(`❌ [GlobalNotifications] Error details:`, JSON.stringify(error, null, 2));
    });

    const handleOrderCreated = (data: any) => {
      console.log("📦📦📦 [GlobalNotifications] [order.created] Event received!");
      console.log("📦 [GlobalNotifications] Full event data:", JSON.stringify(data, null, 2));
      console.log("📦 [GlobalNotifications] Event timestamp:", new Date().toISOString());

      const order = data.order || data;

      if (!order || !order.order_id) {
        console.warn(
          "⚠️ [GlobalNotifications] [order.created] event received but no order data found"
        );
        console.warn("⚠️ [GlobalNotifications] Data structure:", Object.keys(data || {}));
        return;
      }

      console.log("📦 [GlobalNotifications] Order data:", {
        order_id: order.order_id,
        status_id: order.status_id,
        order_total: order.order_total,
        location_name: order.location_name,
      });

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
      console.log("🔄🔄🔄 [GlobalNotifications] [order.updated] Event received!");
      console.log("🔄 [GlobalNotifications] Full event data:", JSON.stringify(data, null, 2));
      console.log("🔄 [GlobalNotifications] Event timestamp:", new Date().toISOString());

      const order = data.order || data;

      if (!order || !order.order_id) {
        console.warn(
          "⚠️ [GlobalNotifications] [order.updated] event received but no order data found"
        );
        return;
      }

      console.log("🔄 [GlobalNotifications] Updating order #" + order.order_id);
      
      // Emit custom event for pages that want to refresh their data
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("admin:order-updated", { detail: order })
        );
      }
    };

    channel.bind("order.updated", handleOrderUpdated);

    const handleOrderStatusChanged = (data: any) => {
      console.log("🔄📊🔄 [GlobalNotifications] [order.status.changed] Event received!");
      console.log("🔄 [GlobalNotifications] Full event data:", JSON.stringify(data, null, 2));
      console.log("🔄 [GlobalNotifications] Event timestamp:", new Date().toISOString());

      if (!data.order_id) {
        console.warn(
          "⚠️ [GlobalNotifications] [order.status.changed] event received but missing order_id"
        );
        return;
      }

      console.log("🔄 [GlobalNotifications] Changing status for order #" + data.order_id);
      
      // Emit custom event for pages that want to refresh their data
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("admin:order-status-changed", { detail: data })
        );
      }
    };

    channel.bind("order.status.changed", handleOrderStatusChanged);

    const handleOrderDeleted = (data: any) => {
      console.log("🗑️🗑️🗑️ [GlobalNotifications] [order.deleted] Event received!");
      console.log("🗑️ [GlobalNotifications] Full event data:", JSON.stringify(data, null, 2));
      console.log("🗑️ [GlobalNotifications] Event timestamp:", new Date().toISOString());

      if (data.order_id) {
        console.log("🗑️ [GlobalNotifications] Deleting order #" + data.order_id);
        
        // Emit custom event for pages that want to refresh their data
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("admin:order-deleted", { detail: data })
          );
        }
      } else {
        console.warn(
          "⚠️ [GlobalNotifications] [order.deleted] event received but no order_id found"
        );
      }
    };

    channel.bind("order.deleted", handleOrderDeleted);

    console.log(`🔗 [GlobalNotifications] Channel ${channelName} binding complete`);
    console.log(
      `🔗 [GlobalNotifications] Listening for events: order.created, order.updated, order.status.changed, order.deleted`
    );

    return () => {
      console.log(`🔌 [GlobalNotifications] Unsubscribing from ${channelName}`);
      console.log(`🔌 [GlobalNotifications] Cleaning up event listeners`);

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

