"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

interface MenuItem {
  menu_id: number;
  menu_name: string;
  menu_price: number;
  currency: string;
  image?: {
    url: string;
  };
}

export default function FeaturedMenuCarousel({
  locationSlug,
  locale,
  featuredMenuIds,
}: {
  locationSlug: string;
  locale: string;
  featuredMenuIds: number[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [emblaRef] = useEmblaCarousel({ dragFree: true, align: "start" });

  const LOCATION_ID =
    process.env.NEXT_PUBLIC_LOCATION_ID ?? process.env.NEXT_LOCATION_ID;

  useEffect(() => {
    async function loadAllPages() {
      let allItems: MenuItem[] = [];
      let totalPages = 1;

      async function fetchJson(url: string) {
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Request failed ${res.status}: ${text}`);
        }
        return res.json();
      }

      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        const firstData = await fetchJson(
          `${base}/api/locations/${LOCATION_ID}/menu-items?page=1`
        );

        if (!firstData?.data?.menu_items) {
          throw new Error("Invalid API response: missing data.menu_items");
        }

        allItems = [...firstData.data.menu_items];
        totalPages = firstData.data.pagination?.last_page ?? 1;

        const pageRequests: Promise<any>[] = [];
        for (let p = 2; p <= totalPages; p++) {
          pageRequests.push(
            fetchJson(
              `${base}/api/locations/${LOCATION_ID}/menu-items?page=${p}`
            )
          );
        }

        const pages = await Promise.all(pageRequests);
        pages.forEach((pageData) => {
          if (pageData?.data?.menu_items) {
            allItems = [...allItems, ...pageData.data.menu_items];
          }
        });

        const filtered = allItems.filter((item) =>
          featuredMenuIds.includes(item.menu_id)
        );

        setItems(filtered);
      } catch (err) {
        console.error("❌ Failed to fetch menu items:", err);
      }
    }

    loadAllPages();
  }, [featuredMenuIds]);

  if (!items.length) return null;

  return (
    <div className="w-full mb-8">
      {/* Embla wrapper - px-1 prevents hover shadow clipping */}
      <div className="embla overflow-hidden px-1" ref={emblaRef}>
        <div className="embla__container flex gap-4">
          {items.map((item) => (
            <div
              key={item.menu_id}
              // Restored max-w-[220px] to enforce consistent card width like the bottom row
              className="embla__slide min-w-[200px] max-w-[200px] cursor-pointer bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-[var(--brand-border)] hover:shadow-[0_0_15px_rgba(255,147,40,0.2)] hover:scale-[1.02] transition-all duration-300 group"
              onClick={() =>
                router.push(
                  `/${locale}/location/${locationSlug}?select=${item.menu_id}`
                )
              }
            >
              <div className="relative h-[150px] w-full">
                {item.image?.url ? (
                  <Image
                    src={item.image.url}
                    alt={item.menu_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-zinc-800" />
                )}
              </div>

              <div className="p-3">
                <p className="text-white font-semibold text-sm line-clamp-2 h-10 overflow-hidden" title={item.menu_name}>
                  {item.menu_name}
                </p>

                <p className="text-white font-bold mt-1 text-base">
                  {item.menu_price.toFixed(2)} {item.currency}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}