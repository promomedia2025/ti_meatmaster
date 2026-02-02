"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";

interface HeroVideoCarouselClientProps {
  videos: string[];
}

export function HeroVideoCarouselClient({
  videos,
}: HeroVideoCarouselClientProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const loadedVideos = useRef<Set<number>>(new Set());
  const [isIOS, setIsIOS] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState<Set<number>>(new Set());
  const [showPlaceholders, setShowPlaceholders] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const rafId = useRef<number | null>(null);

  // Generate placeholder image paths for each video
  const placeholderImages = videos.map(
    (_, idx) => `/carousel_videos/videoPlaceholder${idx + 1}.png`
  );

  const autoplay = useRef(Autoplay({ delay: 8000, stopOnInteraction: false }));

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

  // Detect iOS devices (playsInline is only needed for iOS Safari)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    }
  }, []);

  // Hide placeholders after 3.5 seconds to simulate loading with smooth fade-out
  useEffect(() => {
    const timer = setTimeout(() => {
      // Start fade-out animation
      setFadeOut(true);
      // Hide completely after fade animation completes
      setTimeout(() => {
        setShowPlaceholders(false);
      }, 500); // 500ms for fade-out transition
    }, 1500); // 3.5 seconds before starting fade

    return () => clearTimeout(timer);
  }, []);

  // Handle video loading states
  const handleVideoLoadStart = useCallback((index: number) => {
    setLoadingVideos((prev) => new Set(prev).add(index));
  }, []);

  const handleVideoCanPlay = useCallback((index: number) => {
    setLoadingVideos((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  const handleVideoError = useCallback((index: number) => {
    setLoadingVideos((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  // Optimized video handling with lazy loading and memory management
  const handleVideoPlay = useCallback(() => {
    if (!embla) return;

    // Cancel any pending animation frame
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      const visibleIndices = embla.slidesInView();
      const prevIndex = embla.previousScrollSnap();
      const nextIndex = embla.selectedScrollSnap();

      // Get indices that should be loaded (current, next, previous, and adjacent)
      // Pre-buffer more aggressively for smoother playback
      const indicesToLoad = new Set([
        ...visibleIndices,
        nextIndex,
        prevIndex,
        nextIndex + 1,
        nextIndex - 1,
        nextIndex + 2,
        nextIndex - 2,
      ]);

      videoRefs.current.forEach((video, index) => {
        if (!video) return;
        const isVisible = visibleIndices.includes(index);
        const shouldLoad = indicesToLoad.has(index);

        // Lazy load videos only when needed
        if (shouldLoad && !loadedVideos.current.has(index)) {
          video.load();
          loadedVideos.current.add(index);
        }

        if (isVisible) {
          // Only play if not already playing and video is ready
          if (video.paused) {
            // Check if video has enough data to play (readyState >= 3 means HAVE_FUTURE_DATA)
            if (video.readyState >= 3) {
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => {
                  // Ignore autoplay errors - they're expected in some browsers
                });
              }
            } else {
              // Video not ready yet, wait for canplay event
              const playWhenReady = () => {
                if (video.readyState >= 3 && video.paused) {
                  video.play().catch(() => {});
                  video.removeEventListener("canplay", playWhenReady);
                  video.removeEventListener("canplaythrough", playWhenReady);
                }
              };
              video.addEventListener("canplay", playWhenReady, { once: true });
              video.addEventListener("canplaythrough", playWhenReady, {
                once: true,
              });
            }
          }
        } else {
          // Only pause if currently playing
          if (!video.paused) {
            video.pause();
          }
          // Reset video time for smooth transitions
          if (shouldLoad) {
            video.currentTime = 0;
          }
        }
      });
    });
  }, [embla]);

  // Preload all videos immediately on mount
  useEffect(() => {
    // Load all videos immediately
    videos.forEach((_, idx) => {
      const video = videoRefs.current[idx];
      if (video && !loadedVideos.current.has(idx)) {
        video.load();
        loadedVideos.current.add(idx);
      }
    });
  }, [videos]);

  useEffect(() => {
    if (!embla) return;

    // Use requestAnimationFrame for smooth scroll handling
    const handleScroll = () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      rafId.current = requestAnimationFrame(handleVideoPlay);
    };

    embla.on("select", handleVideoPlay);
    embla.on("scroll", handleScroll);
    embla.on("reInit", handleVideoPlay);

    // Initial load
    handleVideoPlay();

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      embla.off("select", handleVideoPlay);
      embla.off("scroll", handleScroll);
      embla.off("reInit", handleVideoPlay);
    };
  }, [embla, handleVideoPlay]);

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
                    // Immediately load all videos when ref is set
                    if (el && !loadedVideos.current.has(idx)) {
                      el.load();
                      loadedVideos.current.add(idx);
                    }
                  }}
                  onLoadStart={() => handleVideoLoadStart(idx)}
                  onCanPlay={() => handleVideoCanPlay(idx)}
                  onCanPlayThrough={() => handleVideoCanPlay(idx)}
                  onError={() => handleVideoError(idx)}
                  src={src}
                  className="absolute inset-0 w-full h-full object-cover will-change-transform"
                  muted
                  preload="auto"
                  {...(isIOS && { playsInline: true })}
                  loop
                />
                {/* Blurred placeholder overlay that shows for first 3.5 seconds */}
                {showPlaceholders && (
                  <div
                    className={`absolute inset-0 w-full h-full z-10 transition-opacity duration-500 ${
                      fadeOut ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <Image
                      src={placeholderImages[idx]}
                      alt={`Video placeholder ${idx + 1}`}
                      fill
                      className="object-cover blur-[5px]"
                      priority={idx < 2} // Prioritize first 2 images for faster initial load
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
