import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateEtags: true,
  
  generateBuildId: async () => {
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