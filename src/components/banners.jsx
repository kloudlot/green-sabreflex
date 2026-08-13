import React from "react";
import { AlertTriangle, CloudOff } from "lucide-react";

/** Surfaces rows the normalizer had to skip, so bad cells never vanish silently. */
export function IssueBanner({ issues }) {
  if (issues.length === 0) return null;
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-300">
            {issues.length} row{issues.length === 1 ? "" : "s"} skipped &mdash; totals
            below exclude {issues.length === 1 ? "it" : "them"}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {issues.slice(0, 5).map((issue, i) => (
              <li key={i} className="text-xs text-amber-200/70">
                <span className="font-mono">{issue.tab}</span> row {issue.row}:{" "}
                {issue.reason}
              </li>
            ))}
          </ul>
          {issues.length > 5 && (
            <p className="mt-1 text-xs text-amber-200/50">
              &hellip;and {issues.length - 5} more
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Shown when a refresh fails but cached data is still on screen. */
export function SyncErrorBanner({ error, onRefresh }) {
  if (!error) return null;
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
      <div className="flex items-start gap-3 min-w-0">
        <CloudOff size={16} className="mt-0.5 shrink-0 text-red-400" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-red-300">
            Could not refresh from the sheet
          </p>
          <p className="mt-0.5 text-xs text-red-200/70">{error}</p>
        </div>
      </div>
      <button
        onClick={onRefresh}
        className="shrink-0 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/10"
      >
        Try again
      </button>
    </div>
  );
}
