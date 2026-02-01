"use client";
import HeroVideoCarousel from "@/components/HeroVideoCarousel";
import FeaturedMenuCarousel from "@/components/FeaturedMenuCarousel";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useRef, Suspense, useState } from "react";
import { Navigation } from "@/components/navigation";
import { CategoryGrid } from "@/components/category-grid";
import { RestaurantGrid } from "@/components/restaurant-grid";
import { usePusher } from "@/lib/pusher-context";
import { getActiveOrderIds } from "@/lib/active-orders";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { User, Bike, Car } from "lucide-react";
import Image from "next/image";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useTranslations } from "@/lib/i18n/translations-provider";
import { WoltNavbar } from "@/components/ui/woltcopies/woltnavbar";

const featuredMenuIds = [112, 101, 177, 406, 92, 176, 184, 196];
const featuredDiscountIds = [553, 554, 555, 556, 557, 558, 559, 563];

export default function HomePage() {
  const { dict, lang } = useTranslations();
  const { subscribe, unsubscribe, isConnected, pusher } = usePusher();
  const subscribedChannelsRef = useRef<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [radius, setRadius] = useState(5);

  // Scroll to top on page load/reload
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Subscribe to all active orders for real-time notifications
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const activeOrderIds = getActiveOrderIds();

    if (activeOrderIds.length === 0) {
      return;
    }

    // Subscribe to each active order channel
    activeOrderIds.forEach((orderId) => {
      const channelName = `order.${orderId}`;

      // Skip if already subscribed
      if (subscribedChannelsRef.current.has(channelName)) {
        return;
      }

      const channel = subscribe(channelName);

      if (channel) {
        // Unbind any existing handlers first to prevent duplicates
        channel.unbind("orderStatusUpdated");

        subscribedChannelsRef.current.add(channelName);

        channel.bind("pusher:subscription_succeeded", () => {});

        channel.bind("pusher:subscription_error", (error: any) => {
          subscribedChannelsRef.current.delete(channelName);
        });

        // Listen for order status updates
        channel.bind("orderStatusUpdated", (data: any) => {
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
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <h1 className="text-2xl font-bold text-foreground lg:hidden">
              {dict.home.title}
            </h1>
          </div>
        </div>
        <Suspense
          fallback={
            <div className="text-center py-8">
              {dict.home.loadingCategories}
            </div>
          }
        >
          <CategoryGrid />
        </Suspense>

        <div className="mb-8">
          <HeroVideoCarousel />
        </div>


        <h2 className="text-2xl font-bold mb-4 text-white">Δείτε το μενού</h2>

        <Suspense
          fallback={
            <div className="text-center py-8">
              {dict.home.loadingRestaurants}
            </div>
          }
        >
          <RestaurantGrid radius={radius} />
        </Suspense>

        <h2 className="text-2xl font-bold mb-4 mt-8 text-white">
          Προσφορές
        </h2>

        <FeaturedMenuCarousel
          featuredMenuIds={featuredDiscountIds}
          locale={lang}
          locationSlug="cocofino-13"
        />

        <div className="w-full my-8 rounded-xl overflow-hidden shadow-lg border border-white/10">
          <video
            className="w-full h-auto object-cover"
            autoPlay
            loop
            muted
            playsInline
            // Ensure the file is in your /public folder
            src="/delivery.mp4" 
          />
        </div>

        {/* FEATURED MENU ITEMS CAROUSEL */}
        <h2 className="text-2xl font-bold mb-4 mt-8 text-white">
          Προτεινόμενα Πιάτα
        </h2>

        <FeaturedMenuCarousel
          featuredMenuIds={featuredMenuIds}
          locale={lang}
          locationSlug="cocofino-13"
        />
      </main>

      {/* Mobile Bottom Navigation - only on home page */}
      <MobileBottomNav />
    </div>
  );
}
