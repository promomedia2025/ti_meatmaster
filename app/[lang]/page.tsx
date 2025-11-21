"use client";

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
import image1 from "@/public/4b91a26ed2a144c1bd95f30a01a184e7.webp";
import image2 from "@/public/83a7f18fbb1b-1440x495_mexican_tacos.webp";
import image3 from "@/public/shutterstock_2009487272.jpg";
import image4 from "@/public/pizza-peperoni.jpg";
import image5 from "@/public/seafood-_-scaled.jpg";
import image6 from "@/public/TRESORELLE-0076.jpg";
import image7 from "@/public/wang1.jpg";
import BrandCarousel from "@/components/ui/woltcopies/BrandCarousel";

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
            <h1 className="text-2xl font-bold text-foreground">
              {dict.home.title}
            </h1>
            <div className="flex flex-row gap-2 w-fit md:w-auto">
              {[
                {
                  key: "walking",
                  label: dict.home.transportWalking,
                  radius: 1,
                  icon: User,
                },
                {
                  key: "bike",
                  label: dict.home.transportBike,
                  radius: 2,
                  icon: Bike,
                },
                {
                  key: "car",
                  label: dict.home.transportCar,
                  radius: 5,
                  icon: Car,
                },
              ].map((transport) => {
                const Icon = transport.icon;
                return (
                  <button
                    key={transport.key}
                    onClick={() =>
                      handleTransportSelect(
                        transport.key as "walking" | "bike" | "car"
                      )
                    }
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-full transition-all duration-200 ${
                      selectedTransport === transport.key
                        ? "bg-[#ff9328ff] text-white shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {transport.label}
                  </button>
                );
              })}
            </div>
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
            className="w-full"
          >
            <CarouselContent>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative h-[300px] lg:h-[500px] rounded-lg overflow-hidden">
                  <Image
                    src={image1}
                    alt="Featured 1"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6">
                      <h3 className="text-white text-2xl font-bold mb-2">
                        {dict.home.discoverFlavors}
                      </h3>
                      <p className="text-white/90">
                        {dict.home.orderFromFavorites}
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full h-[300px] lg:h-[500px] rounded-lg overflow-hidden">
                  <Image
                    src={image2}
                    alt="Featured 2"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6">
                      <h3 className="text-white text-2xl font-bold mb-2">
                        {dict.home.fastDelivery}
                      </h3>
                      <p className="text-white/90">{dict.home.hotAndFresh}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full h-[300px] lg:h-[500px] rounded-lg overflow-hidden">
                  <Image
                    src={image3}
                    alt="Featured 3"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6">
                      <h3 className="text-white text-2xl font-bold mb-2">
                        {dict.home.specialOffers}
                      </h3>
                      <p className="text-white/90">{dict.home.specialDeals}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full h-[300px] lg:h-[500px] rounded-lg overflow-hidden">
                  <Image
                    src={image4}
                    alt="Featured 3"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6">
                      <h3 className="text-white text-2xl font-bold mb-2">
                        {dict.home.specialOffers}
                      </h3>
                      <p className="text-white/90">{dict.home.specialDeals}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>

              <CarouselItem className="basis-full lg:basis-1/2">
                <div className="relative w-full h-[300px] lg:h-[500px] rounded-lg overflow-hidden">
                  <Image
                    src={image5}
                    alt="Featured 3"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6">
                      <h3 className="text-white text-2xl font-bold mb-2">
                        {dict.home.specialOffers}
                      </h3>
                      <p className="text-white/90">{dict.home.specialDeals}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full md:basis-1/2">
                <div className="relative w-full h-[300px] lg:h-[500px] rounded-lg overflow-hidden">
                  <Image
                    src={image6}
                    alt="Featured 3"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6">
                      <h3 className="text-white text-2xl font-bold mb-2">
                        {dict.home.specialOffers}
                      </h3>
                      <p className="text-white/90">{dict.home.specialDeals}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem className="basis-full md:basis-1/2">
                <div className="relative w-full h-[300px] lg:h-[500px] rounded-lg overflow-hidden">
                  <Image
                    src={image7}
                    alt="Featured 3"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6">
                      <h3 className="text-white text-2xl font-bold mb-2">
                        {dict.home.specialOffers}
                      </h3>
                      <p className="text-white/90">{dict.home.specialDeals}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex md:ml-15" />
            <CarouselNext className="hidden md:flex md:mr-15" />
          </Carousel>
        </div>

        <div className="mb-8">
          <BrandCarousel />
        </div>
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
