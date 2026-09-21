"use client";

import { useEffect, useState } from "react";

export function VersionChecker() {
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    // Check for version updates every 30 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/version.json", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const currentBuildId = process.env.NEXT_PUBLIC_BUILD_ID || "";
          if (data.buildId && data.buildId !== currentBuildId) {
            setShowReload(true);
          }
        }
      } catch {
        // Ignore errors
      }
    }, 30000);

    // Also check on focus/visibility change
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          const res = await fetch("/version.json", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            const currentBuildId = process.env.NEXT_PUBLIC_BUILD_ID || "";
            if (data.buildId && data.buildId !== currentBuildId) {
              setShowReload(true);
            }
          }
        } catch {
          // Ignore errors
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!showReload) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-[#e6c98a] rounded-xl shadow-lg p-4 max-w-sm animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-medium text-[#6b4a2b]">Update tersedia</p>
            <p className="text-sm text-[#5a4a3a] mt-1">
              Versi baru aplikasi telah dirilis. Silakan muat ulang untuk mendapatkan fitur terbaru.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-[#A0522D] text-white text-sm font-medium rounded-lg hover:bg-[#8b4513] transition"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    </div>
  );
}