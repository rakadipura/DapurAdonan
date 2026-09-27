"use client";

export function ProductCardSkeleton() {
  return (
    <div className="group rounded-xl border border-brand-border-light bg-white shadow-sm flex flex-col h-full animate-pulse">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-brand-bg-card">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-bg-card via-brand-border-light to-brand-bg-card animate-shimmer" />
      </div>
      <div className="p-4 flex flex-col flex-1 space-y-3">
        <div className="h-3 w-1/4 rounded bg-brand-border-light" />
        <div className="h-5 w-3/4 rounded bg-brand-border-light" />
        <div className="h-4 w-full rounded bg-brand-border-light" />
        <div className="h-4 w-2/3 rounded bg-brand-border-light" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-brand-border-light" />
          <div className="h-5 w-16 rounded-full bg-brand-border-light" />
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="h-6 w-24 rounded bg-brand-border-light" />
          <div className="h-4 w-20 rounded bg-brand-border-light" />
        </div>
        <div className="h-10 w-full rounded-lg bg-brand-border-light" />
      </div>
    </div>
  );
}