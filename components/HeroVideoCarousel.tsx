"use client";

import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export default function DualVideoHero() {
  const videos = [
    "/1.mp4", "/2.mp4", "/3.mp4", "/4.mp4", 
    "/5.mp4", "/6.mp4", "/7.mp4", "/8.mp4", "/9.mp4",
  ];

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const autoplay = useRef(
    Autoplay({ delay: 8000, stopOnInteraction: false })
  );

  // ALIGNMENT:
  // Mobile: 'center' (standard 1-item carousel feel)
  // Desktop: 'start' (starts from left to allow 2 items side-by-side)
  const [emblaRef, embla] = useEmblaCarousel(
    { 
      loop: true, 
      align: "center", 
      breakpoints: { 
        '(min-width: 1024px)': { align: 'start' } 
      } 
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
    }
  }, [embla]);

  return (
    <div className="w-full mb-10">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {videos.map((src, idx) => (
            <div
              key={idx}
              // WIDTH SETTINGS:
              // basis-full = 1 item on Mobile (100% width)
              // lg:basis-1/2 = 2 items on Desktop (50% width)
              className="shrink-0 grow-0 basis-full lg:basis-1/2 px-1"
            >
              {/* HEIGHT SETTINGS: */}
              {/* h-[220px] = Matches the banner height in your screenshot */}
              {/* lg:h-[420px] = Keeps the taller height for desktop */}
              <div className="relative w-full h-[220px] lg:h-[420px] bg-black rounded-xl overflow-hidden">
                <video
                  ref={(el) => { videoRefs.current[idx] = el; }}
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