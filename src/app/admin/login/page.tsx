"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Gagal masuk");
          return;
        }
        router.push(next);
        router.refresh();
      } catch {
        setError("Tidak dapat terhubung ke server");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#fffaf0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#efe2c7] bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-[#6b4a2b]">Admin — Toko Mini Moni</h1>
        <p className="mt-1 text-sm text-[#5a4a3a]">Masuk untuk mengelola pesanan dan booking.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">Password</label>
            <input
              type="password"
              name="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:outline-none focus:ring-1 focus:ring-[#A0522D]"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full rounded-lg border-0 bg-[#A0522D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8b4513] disabled:opacity-50"
          >
            {isSubmitting ? "Memproses…" : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
