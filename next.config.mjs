/** @type {import('next').NextConfig} */
const nextConfig = {
   experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable image optimization for better caching
    unoptimized: process.env.NEXT_EXPORT === "true",
    // Configure remote image domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_CONFIG,
        pathname: "/**",
      },
    ],
    // Image caching configuration
    minimumCacheTTL: 31536000, // 1 year in seconds
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // For static export (Option 2)
  output: process.env.NEXT_EXPORT === "true" ? "export" : undefined,
  trailingSlash: process.env.NEXT_EXPORT === "true",
  // Disable server-side features for static export
  ...(process.env.NEXT_EXPORT === "true" && {
    distDir: "out",
  }),
  // Cache headers for static assets
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
