import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generate ETags for static assets
  generateEtags: true,
  
  // Cache-Control headers
  async headers() {
    return [
      {
        // Static assets in public/images - long cache with immutable
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Other static assets by extension
        source: "/:path*.:ext(woff|woff2|svg|png|jpg|jpeg|gif|webp|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // HTML pages - short cache with revalidation
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  
  // Ensure build ID changes on each deployment
  generateBuildId: async () => {
    // Use git commit hash or timestamp for unique build ID
    const { execSync } = await import("child_process");
    try {
      const hash = execSync("git rev-parse --short HEAD").toString().trim();
      return hash;
    } catch {
      return Date.now().toString();
    }
  },
};

export default nextConfig;