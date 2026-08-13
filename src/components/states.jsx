import React from "react";
import { RefreshCw, CloudOff } from "lucide-react";

import { Card, Header, Shell, Skeleton } from "./ui";

/** Cold load: no cache, no bundled snapshot, nothing to show yet. */
export function DashboardSkeleton() {
  return (
    <Shell>
      <Header right={<Skeleton className="h-8 w-40 rounded-full" />} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="mt-4 h-7 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-6 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </Card>
          ))}
        </div>
        <Card>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mx-auto mt-6 h-40 w-40 rounded-full" />
        </Card>
      </div>

      <p className="text-center text-xs text-slate-500">
        Loading from Google Sheet&hellip;
      </p>
    </Shell>
  );
}

/** Fetch failed with no cache to fall back on. */
export function LoadFailure({ error, onRefresh }) {
  return (
    <Shell>
      <Header right={null} />
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <CloudOff size={28} className="mx-auto text-red-400" />
        <p className="mt-4 text-base font-semibold text-white">
          Could not load the dashboard
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-red-200/70">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    </Shell>
  );
}
