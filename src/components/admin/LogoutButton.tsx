"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="rounded-lg border border-[#e6c98a] px-3 py-1.5 text-sm font-medium text-[#6b4a2b] transition hover:bg-[#fffaf0] disabled:opacity-50"
    >
      {isPending ? "Keluar…" : "Keluar"}
    </button>
  );
}
