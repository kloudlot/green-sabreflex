import React from "react";

/** Page frame — dark ground, centred column, consistent section rhythm. */
export function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 space-y-8">
        {children}
      </div>
    </div>
  );
}

/** The standard bordered panel every section is built from. */
export function Card({ className = "", style, children }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 ${className}`} style={style}>
      {children}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {eyebrow}
      </p>
      <h2 className="text-lg font-semibold text-white mt-0.5">{title}</h2>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

/** Marks a figure that was reconstructed rather than read from the source. */
export function EstBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 align-middle">
      est.
    </span>
  );
}

export function Header({ right }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
          SF
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            SabreWorks Investment Ltd
          </h1>
          <p className="text-sm text-slate-400">
            SabreFlex Dashboard 
            {/* &middot; Payables Jul&ndash;Dec 2026 */}
          </p>
        </div>
      </div>
      {right}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/70 ${className}`} />;
}

/** Placeholder held while a lazily-loaded chart chunk arrives. */
export function ChartSkeleton({ height = "h-56" }) {
  return (
    <div className={`flex ${height} items-center justify-center`}>
      <Skeleton className="h-full w-full" />
    </div>
  );
}

const SEARCH_SIZES = {
  sm: "py-1.5 text-xs",
  md: "w-full py-2 text-sm",
};

export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
  icon: Icon,
  size = "md",
}) {
  return (
    <div className={`relative ${className}`}>
      <Icon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none ${SEARCH_SIZES[size]}`}
      />
    </div>
  );
}
