import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import athinaikon from "@/public/athinaikon-greek.jpg";
import { StaticImageData } from "next/image";

const brands = [
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
  {
    name: "Athinaikon Greek",
    image: athinaikon,
  },
];

export default function BrandCarousel({
  list = brands,
  title = "Brand Carousel",
}: {
  list: { name: string; image: StaticImageData }[];
  title: string;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const itemsPerScroll = 6;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollButtons = () => {
      if (container) {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        setCanScrollPrev(scrollLeft > 0);
        setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    updateScrollButtons();
    container.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      container.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, []);

  const scrollToNext = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const firstCard = container.querySelector(
      "div > div:first-child"
    ) as HTMLElement;
    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth;
    // Get gap from computed style - gap-2 (8px) on mobile, gap-4 (16px) on md+
    const gap = window.innerWidth >= 768 ? 16 : 8;
    const scrollAmount = (cardWidth + gap) * itemsPerScroll;

    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollToPrev = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const firstCard = container.querySelector(
      "div > div:first-child"
    ) as HTMLElement;
    if (!firstCard) return;

    const cardWidth = firstCard.offsetWidth;
    // Get gap from computed style - gap-2 (8px) on mobile, gap-4 (16px) on md+
    const gap = window.innerWidth >= 768 ? 16 : 8;
    const scrollAmount = (cardWidth + gap) * itemsPerScroll;

    container.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full relative">
      <div className="flex gap-2 justify-between pb-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={scrollToPrev}
            disabled={!canScrollPrev}
            className="hidden md:flex z-10 h-10 w-10 items-center justify-center rounded-full bg-[#001924] shadow-md hover:bg-[#002636] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="#009de0"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <button
            onClick={scrollToNext}
            disabled={!canScrollNext}
            className="hidden md:flex z-10 h-10 w-10 items-center justify-center rounded-full bg-[#001924] shadow-md hover:bg-[#002636] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="#009de0"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex gap-2 md:gap-4 w-full max-w-full">
          {list.map((brand, index) => (
            <div key={index} className="flex-shrink-0 flex-grow-0">
              <div className="relative w-[150px] h-[150px] sm:w-[180px] sm:h-[180px] md:w-[287px] md:h-[305px] bg-gray-900 border border-gray-800 rounded-md overflow-hidden">
                <Image
                  src={brand.image}
                  alt={brand.name}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(min-width: 768px) 250px, 150px"
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-[#242424] text-white text-sm md:text-base lg:text-lg font-medium z-10">
                  <p>{brand.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
