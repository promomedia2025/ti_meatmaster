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

  const LOCATION_ID = 13;

  useEffect(() => {
    async function loadAllPages() {
      let allItems: MenuItem[] = [];
      let currentPage = 1;
      let totalPages = 1;

      try {
        const firstRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/locations/${LOCATION_ID}/menu-items?page=1`
        );
        const firstData = await firstRes.json();

        allItems = [...firstData.data.menu_items];
        totalPages = firstData.data.pagination.last_page;

        const pageRequests = [];
        for (let p = 2; p <= totalPages; p++) {
          pageRequests.push(
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/locations/${LOCATION_ID}/menu-items?page=${p}`
            ).then((res) => res.json())
          );
        }

        const pages = await Promise.all(pageRequests);
        pages.forEach((pageData) => {
          allItems = [...allItems, ...pageData.data.menu_items];
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
      {/* Embla wrapper */}
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex gap-4">
          {items.map((item) => (
            <div
              key={item.menu_id}
              className="embla__slide min-w-[200px] max-w-[220px] cursor-pointer bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:scale-[1.03] transition-transform"
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
                  <div className="h-full w-full bg-gray-800" />
                )}
              </div>

              <div className="p-3">
                <p className="text-white font-semibold text-sm line-clamp-2 h-10 overflow-hidden">
                  {item.menu_name}
                </p>

                <p className="text-[#ff9328ff] font-bold mt-1 text-sm">
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
