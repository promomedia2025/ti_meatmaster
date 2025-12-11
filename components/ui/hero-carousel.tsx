"use client";

import React, { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export default function HeroCarousel({ videos }: { videos: string[] }) {
  const autoplay = useRef(
    Autoplay({ delay: 8000, stopOnInteraction: false })
  );
  const [emblaRef, embla] = useEmblaCarousel({ loop: true }, [autoplay.current]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setActive(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
  }, [embla]);

  return (
    <div className="w-full mb-10">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {videos.map((src, idx) => (
            <div
              key={idx}
              className="w-full lg:w-1/2 shrink-0"
            >
              <div className="relative w-full h-[420px] rounded-xl overflow-hidden bg-black">
                <video
                  src={src}
                  muted
                  playsInline
                  autoPlay={active === idx}
                  loop={active === idx}
                  preload={active === idx ? "auto" : "none"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
