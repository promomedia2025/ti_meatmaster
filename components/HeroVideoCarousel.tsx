"use client";

import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export default function DualVideoHero() {
  const videos = [
    "https://cocofino.bettersolution.gr/assets/media/uploads/1.mp4",
    "https://cocofino.bettersolution.gr/assets/media/uploads/2.mp4",
    "https://cocofino.bettersolution.gr/assets/media/uploads/3.mp4",
    "https://cocofino.bettersolution.gr/assets/media/uploads/4.mp4",
    "https://cocofino.bettersolution.gr/assets/media/uploads/5.mp4",
    "https://cocofino.bettersolution.gr/assets/media/uploads/6.mp4",
    "https://cocofino.bettersolution.gr/assets/media/uploads/7.mp4",
    "https://cocofino.bettersolution.gr/assets/media/uploads/8.mp4",
    "https://cocofino.bettersolution.gr/assets/media/uploads/9.mp4",
  ];

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const autoplay = useRef(Autoplay({ stopOnInteraction: false }));

  const [emblaRef, embla] = useEmblaCarousel(
    {
      loop: true,
      align: "center", // Center for mobile/tablet
      breakpoints: {
        // On large screens (1024px+), align start for the 2-column layout
        "(min-width: 1024px)": { align: "start" },
      },
    },
    [autoplay.current]
  );

  useEffect(() => {
    if (!embla) return;

    const handleVideoPlay = () => {
      const visibleIndices = embla.slidesInView();

      videoRefs.current.forEach((video, index) => {
        if (!video) return;
        if (visibleIndices.includes(index)) {
          video.play().catch((e) => console.log("Autoplay blocked:", e));
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    };

    embla.on("select", handleVideoPlay);
    embla.on("scroll", handleVideoPlay);
    embla.on("reInit", handleVideoPlay);

    handleVideoPlay();

    return () => {
      embla.off("select", handleVideoPlay);
      embla.off("scroll", handleVideoPlay);
      embla.off("reInit", handleVideoPlay);
    };
  }, [embla]);

  return (
    <div className="w-full mb-10">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {videos.map((src, idx) => (
            <div
              key={idx}
              // WIDTH RULES:
              // Mobile & Tablet (<1024px): 100% width (basis-full)
              // Desktop (>=1024px): 50% width (basis-1/2)
              className="shrink-0 grow-0 basis-full lg:basis-1/2 px-2"
            >
              {/* RATIO FIX: 
                  1. Removed fixed 'h-[...]' classes.
                  2. Added 'aspect-video' (16:9 ratio). 
                  This ensures the height automatically shrinks/grows with width.
              */}
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
                <video
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  src={src}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  playsInline
                  loop
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
