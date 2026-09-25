import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateEtags: true,
  
  generateBuildId: async () => {
    // Vercel provides VERCEL_GIT_COMMIT_SHA env var
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 8);
    }
    // Fallback for local builds
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