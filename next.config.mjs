/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // For static export (Option 2)
  output: process.env.NEXT_EXPORT === "true" ? "export" : undefined,
  trailingSlash: process.env.NEXT_EXPORT === "true",
  // Disable server-side features for static export
  ...(process.env.NEXT_EXPORT === "true" && {
    distDir: "out",
  }),
};

export default nextConfig;
