"use client";

export function BookingSlotSkeleton() {
  return (
    <div className="rounded-lg border border-brand-border-light bg-white p-3 animate-pulse">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="h-5 w-3/4 rounded bg-brand-border-light" />
          <div className="h-4 w-1/2 rounded bg-brand-border-light mt-1" />
        </div>
        <div className="h-5 w-24 rounded bg-brand-border-light flex-shrink-0" />
      </div>
    </div>
  );
}

export function BookingDateOptionSkeleton() {
  return (
    <button
      type="button"
      disabled
      className="rounded-xl border p-3 text-left border-brand-border-light bg-gray-50 opacity-60 cursor-not-allowed animate-pulse"
    >
      <div className="text-sm font-medium">
        <div className="h-5 w-24 rounded bg-brand-border-light" />
      </div>
      <div className="text-xs mt-1">
        <div className="h-4 w-32 rounded bg-brand-border-light" />
      </div>
    </button>
  );
}

export function BookingFlowStepSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 rounded bg-brand-border-light" />
      <div className="h-4 w-full rounded bg-brand-border-light" />
      <div className="h-4 w-3/4 rounded bg-brand-border-light" />
      <div className="h-4 w-1/2 rounded bg-brand-border-light" />
      <div className="grid grid-cols-1 gap-2">
        <div className="h-16 rounded-lg border border-brand-border-light bg-brand-bg-form" />
        <div className="h-16 rounded-lg border border-brand-border-light bg-brand-bg-form" />
        <div className="h-16 rounded-lg border border-brand-border-light bg-brand-bg-form" />
      </div>
      <div className="h-10 w-full rounded-lg bg-brand-border-light" />
    </div>
  );
}