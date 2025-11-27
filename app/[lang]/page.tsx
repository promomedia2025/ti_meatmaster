"use client";

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
import image2 from "@/public/83a7f18fbb1b-1440x495_mexican_tacos.webp";
import image3 from "@/public/shutterstock_2009487272.jpg";
import image4 from "@/public/pizza-peperoni.jpg";
import image5 from "@/public/seafood-_-scaled.jpg";
import image6 from "@/public/TRESORELLE-0076.jpg";
import image7 from "@/public/wang1.jpg";
import BrandCarousel from "@/components/ui/woltcopies/BrandCarousel";

const featuredMenuIds = [112, 113, 196, 325, 552];

export default function HomePage() {
  const { dict, lang } = useTranslations();
  const { subscribe, unsubscribe, isConnected, pusher } = usePusher();
  const subscribedChannelsRef = useRef<Set<string>>(new Set());
  const [radius, setRadius] = useState(5);
  const [selectedTransport, setSelectedTransport] = useState<
    "walking" | "bike" | "car"
  >("car");

  const handleTransportSelect = (transport: "walking" | "bike" | "car") => {
    setSelectedTransport(transport);
    switch (transport) {
      case "walking":
        setRadius(1);
        break;
      case "bike":
        setRadius(2);
        break;
      case "car":
        setRadius(5);
        break;
    }
  };

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

        {/* Featured Carousel */}
        <div className="mb-8">

<Carousel
  opts={{
    align: "start",
    loop: true,
  }}
  plugins={[
    Autoplay({
      delay: 10000, // 10 seconds
      stopOnInteraction: false, // keep autoplay even after user scrolls
    }),
  ]}
  className="w-full"
>
            <CarouselContent>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                 <video
                  src="/1.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                 />
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                 <video
                  src="/2.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                 />
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                 <video
                  src="/3.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                 />
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                 <video
                  src="/4.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                 />
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                 <video
                  src="/5.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                 />
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                 <video
                  src="/6.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                 />
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                 <video
                  src="/7.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                 />
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                 <video
                  src="/8.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                 />
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                 <video
                  src="/9.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                 />
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex md:ml-15" />
            <CarouselNext className="hidden md:flex md:mr-15" />
          </Carousel>
        </div>

{/* FEATURED MENU ITEMS CAROUSEL */}
<FeaturedMenuCarousel
  featuredMenuIds={featuredMenuIds}
  locale={lang}
  locationSlug="cocofino-13"
/>


        <Suspense
          fallback={
            <div className="text-center py-8">
              {dict.home.loadingRestaurants}
            </div>
          }
        >
          <RestaurantGrid radius={radius} />
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation - only on home page */}
      <MobileBottomNav />
    </div>
  );
}
