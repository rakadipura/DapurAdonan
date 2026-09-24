"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Simple lookup form that navigates to /status?code=...&phone=...
 * Server-side lookup happens in src/app/status/page.tsx.
 */
export function OrderStatusLookup() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !phone.trim()) return;
    setIsLoading(true);
    router.push(`/status?code=${encodeURIComponent(code.trim().toUpperCase())}&phone=${encodeURIComponent(phone.trim())}`);
  };

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-[#efe2c7] bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="lookup-code" className="mb-1 block text-sm font-medium text-[#6b4a2b]">Kode referensi</label>
            <input
              id="lookup-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Contoh: MM-000001"
              className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="lookup-phone" className="mb-1 block text-sm font-medium text-[#6b4a2b]">Nomor telepon</label>
            <input
              id="lookup-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || code.trim() === "" || phone.trim() === ""}
            className="w-full rounded-lg border-0 bg-[#A0522D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8b4513] disabled:cursor-not-allowed disabled:bg-[#d9b38c]"
          >
            {isLoading ? "Memeriksa…" : "Cek Status"}
          </button>
        </div>
      </form>
    </div>
  );
}
