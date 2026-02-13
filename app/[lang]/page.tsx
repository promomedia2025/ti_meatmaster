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
import { User, Bike, Car, X, Info, ArrowRight } from "lucide-react"; // Added Info, ArrowRight
import Image from "next/image";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useTranslations } from "@/lib/i18n/translations-provider";
import { BetterNavbar } from "@/components/ui/small_comp/betternavbar";
import { useAuth } from "@/lib/auth-context"; // Import Auth Context
import Link from "next/link";

const featuredMenuIds = [229, 101, 177, 406, 92, 176, 184, 196];
const featuredDiscountIds = [553, 561, 562, 564, 566];

export default function HomePage() {
  const { dict, lang } = useTranslations();
  const { subscribe, unsubscribe, isConnected, pusher } = usePusher();
  const { isAuthenticated } = useAuth(); // Get auth status
  const subscribedChannelsRef = useRef<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [radius, setRadius] = useState(5);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  // Scroll to top on page load/reload
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Show renewal modal if not logged in
  useEffect(() => {
    // Small timeout to ensure hydration and smooth entrance
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        setShowRenewalModal(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

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

        channel.bind("pusher:subscription_succeeded", () => { });

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
    <div className="min-h-screen bg-background relative">

      {/* --- RENEWAL NOTICE MODAL --- */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowRenewalModal(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
            {/* Header decoration */}
            <div className="h-2 w-full bg-gradient-to-r from-orange-500 to-red-600" />

            <button
              onClick={() => setShowRenewalModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                <Info className="w-8 h-8 text-orange-500" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                Ανανεωθήκαμε!
              </h3>

              <p className="text-gray-300 mb-8 leading-relaxed">
                Η ιστοσελίδα μας ανανεώθηκε πλήρως για να σας προσφέρουμε καλύτερη εμπειρία.
                <br /><br />
                <span className="font-medium text-orange-400">
                  Παρακαλούμε δημιουργήστε νέο λογαριασμό
                </span> για να συνεχίσετε τις παραγγελίες σας.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowRenewalModal(false)}
                  className="w-full py-3.5 px-6 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  Εντάξει, κατάλαβα
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --------------------------- */}

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
          locationSlug={process.env.NEXT_LOCATION_SLUG}
        />

        <div className="w-full my-8 rounded-xl overflow-hidden shadow-lg border border-white/10">
          <video
            className="w-full h-auto object-cover"
            autoPlay
            loop
            muted
            playsInline
            // Ensure the file is in your /public folder
            src="/deliver.mp4"
          />
        </div>

        {/* FEATURED MENU ITEMS CAROUSEL */}
        <h2 className="text-2xl font-bold mb-4 mt-8 text-white">
          Προτεινόμενα Πιάτα
        </h2>

        <FeaturedMenuCarousel
          featuredMenuIds={featuredMenuIds}
          locale={lang}
          locationSlug={process.env.NEXT_LOCATION_SLUG}
        />
      </main>

      {/* Mobile Bottom Navigation - only on home page */}
      <MobileBottomNav />
    </div>
  );
}