// Server Component - Renders the video structure with SSR
import { HeroVideoCarouselClient } from "./HeroVideoCarouselClient";

const VIDEOS = [
  "/carousel_videos/1.mp4",
  "/carousel_videos/2.mp4",
  "/carousel_videos/3.mp4",
  "/carousel_videos/4.mp4",
  "/carousel_videos/5.mp4",
  "/carousel_videos/6.mp4",
];

export default function HeroVideoCarousel() {
  return <HeroVideoCarouselClient videos={VIDEOS} />;
}
