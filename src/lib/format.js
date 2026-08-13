/* Display formatting. Pure, no domain knowledge. */

export const formatNaira = (n) =>
  `₦${Math.round(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export const compactNaira = (n) => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${sign}₦${(abs / 1_000_000_000).toFixed(1)}b`;
  if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(0)}m`;
  if (abs >= 1_000) return `${sign}₦${(abs / 1_000).toFixed(0)}k`;
  return `${sign}₦${abs}`;
};

/** Dates are ISO `YYYY-MM-DD`; render in UTC so they never shift a day. */
const utc = (iso, options) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    ...options,
    timeZone: "UTC",
  });

export const formatLongDate = (iso) =>
  utc(iso, { day: "numeric", month: "long", year: "numeric" });

export const formatShortDate = (iso) =>
  utc(iso, { day: "numeric", month: "short", year: "numeric" });

export const timeAgo = (iso) => {
  const seconds = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (!Number.isFinite(seconds) || seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};
