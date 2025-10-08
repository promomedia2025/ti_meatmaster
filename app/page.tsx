"use client";

import { useEffect, useRef } from "react";
import { Navigation } from "@/components/navigation";
import { CategoryGrid } from "@/components/category-grid";
import { RestaurantGrid } from "@/components/restaurant-grid";
import { usePusher } from "@/lib/pusher-context";
import { getActiveOrderIds } from "@/lib/active-orders";
import { toast } from "sonner";

export default function HomePage() {
  const { subscribe, unsubscribe, isConnected, pusher } = usePusher();
  const subscribedChannelsRef = useRef<Set<string>>(new Set());

  // Subscribe to all active orders for real-time notifications
  useEffect(() => {
    if (!isConnected) {
      console.log("⚠️ Homepage: Pusher not connected yet");
      return;
    }

    const activeOrderIds = getActiveOrderIds();
    console.log(
      `📡 Homepage: Found ${activeOrderIds.length} active orders to track`
    );

    if (activeOrderIds.length === 0) {
      console.log("ℹ️ Homepage: No active orders to track");
      return;
    }

    // Subscribe to each active order channel
    activeOrderIds.forEach((orderId) => {
      const channelName = `order.${orderId}`;

      // Skip if already subscribed
      if (subscribedChannelsRef.current.has(channelName)) {
        console.log(`⏭️ Already subscribed to ${channelName}`);
        return;
      }

      console.log(`📡 Homepage: Subscribing to ${channelName}`);
      const channel = subscribe(channelName);

      if (channel) {
        // Unbind any existing handlers first to prevent duplicates
        channel.unbind("orderStatusUpdated");

        subscribedChannelsRef.current.add(channelName);

        channel.bind("pusher:subscription_succeeded", () => {
          console.log(`✅ Homepage: Successfully subscribed to ${channelName}`);
        });

        channel.bind("pusher:subscription_error", (error: any) => {
          console.error(
            `❌ Homepage: Failed to subscribe to ${channelName}:`,
            error
          );
          subscribedChannelsRef.current.delete(channelName);
        });

        // Listen for order status updates
        channel.bind("orderStatusUpdated", (data: any) => {
          console.log(`📦 Homepage: Order ${orderId} status updated:`, data);

          const statusName = data.status_name || data.statusName || "Updated";
          toast.success("Ενημέρωση Παραγγελίας", {
            description: `Παραγγελία #${orderId}: ${statusName}`,
            action: {
              label: "Προβολή",
              onClick: () => {
                window.location.href = `/order/${orderId}`;
              },
            },
            duration: 5000,
          });
        });
      }
    });

    // Cleanup function
    return () => {
      subscribedChannelsRef.current.forEach((channelName) => {
        console.log(`🔌 Homepage: Unsubscribing from ${channelName}`);

        // Get the channel and unbind all event handlers
        if (pusher) {
          const channel = pusher.channel(channelName);
          if (channel) {
            channel.unbind("orderStatusUpdated");
          }
        }

        unsubscribe(channelName);
      });
      subscribedChannelsRef.current.clear();
    };
  }, [isConnected, subscribe, unsubscribe, pusher]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Εστιατόρια κοντά μου
          </h1>
          <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <span className="text-sm">Ταξινόμηση με βάση Προτεινόμενα</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
        <CategoryGrid />
        <RestaurantGrid />
      </main>
    </div>
  );
}
