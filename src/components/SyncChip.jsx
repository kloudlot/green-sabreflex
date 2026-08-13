import React from "react";
import { RefreshCw, CloudOff } from "lucide-react";

import { formatLongDate, timeAgo } from "../lib/format";

/** Sync state + manual refresh. Replaces the old static "as of" chip. */
export default function SyncChip({ asOf, status, lastSynced, isFetching, onRefresh }) {
  // Offline snapshot: there is nothing to sync, so show the source date only.
  if (status === "local") {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300">
        As of {formatLongDate(asOf)}
      </span>
    );
  }

  const stale = status === "cached";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
          stale
            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
            : "border-slate-700 bg-slate-900 text-slate-300"
        }`}
      >
        {stale && <CloudOff size={12} />}
        {stale ? "Cached" : "Synced"}
        {lastSynced && ` · ${timeAgo(lastSynced)}`}
      </span>
      <button
        onClick={onRefresh}
        disabled={isFetching}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
      >
        <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
        {isFetching ? "Refreshing" : "Refresh"}
      </button>
    </div>
  );
}
