import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Card, SearchInput, SectionHeading } from "../ui";
import { formatNaira, formatShortDate } from "../../lib/format";

export default function LedgerSection({
  investments,
  buckets,
  ledgerComplete,
  ledgerShown,
  ledgerTotal,
}) {
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState("All maturities");
  const [realtor, setRealtor] = useState("All realtors");

  // Filter options come from the same source as the rows they filter, so the
  // dropdowns can never list a different population than the table.
  const realtorOptions = useMemo(
    () => ["All realtors", ...new Set(investments.map((i) => i.realtor))],
    [investments]
  );
  const bucketOptions = ["All maturities", ...buckets.map((b) => b.label)];

  const filtered = useMemo(
    () =>
      investments.filter((inv) => {
        const term = search.toLowerCase();
        const matchesSearch =
          inv.customer.toLowerCase().includes(term) ||
          inv.realtor.toLowerCase().includes(term);
        const matchesBucket = bucket === "All maturities" || inv.bucket === bucket;
        const matchesRealtor = realtor === "All realtors" || inv.realtor === realtor;
        return matchesSearch && matchesBucket && matchesRealtor;
      }),
    [investments, search, bucket, realtor]
  );

  const selectClass =
    "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none";

  return (
    <section>
      <SectionHeading
        eyebrow="All Investments"
        title="Investment ledger"
        subtitle="Search, filter, and drill into individual deposits"
      />
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <SearchInput
            icon={Search}
            className="flex-1 min-w-[200px]"
            value={search}
            onChange={setSearch}
            placeholder="Search customer or realtor..."
          />
          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value)}
            className={selectClass}
          >
            {bucketOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <select
            value={realtor}
            onChange={(e) => setRealtor(e.target.value)}
            className={selectClass}
          >
            {realtorOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <span className="inline-flex items-center rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-500">
            {filtered.length} of {ledgerTotal} shown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                <th className="py-2 pr-3 font-medium">Customer</th>
                <th className="py-2 pr-3 font-medium">Realtor</th>
                <th className="py-2 pr-3 font-medium text-right">Invested (₦)</th>
                <th className="py-2 pr-3 font-medium text-right">At maturity (₦)</th>
                <th className="py-2 pr-3 font-medium">Maturity date</th>
                <th className="py-2 pr-3 font-medium text-right">Days left</th>
                <th className="py-2 font-medium">Bucket</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-800/60">
                  <td className="py-2 pr-3 text-slate-200">{inv.customer}</td>
                  <td className="py-2 pr-3 text-slate-400">{inv.realtor}</td>
                  <td className="py-2 pr-3 text-right text-slate-300">
                    {formatNaira(inv.invested)}
                  </td>
                  <td className="py-2 pr-3 text-right font-medium text-slate-200">
                    {formatNaira(inv.atMaturity)}
                  </td>
                  <td className="py-2 pr-3 text-slate-400">
                    {formatShortDate(inv.maturityDate)}
                  </td>
                  <td className="py-2 pr-3 text-right text-slate-400">
                    {inv.daysLeft}
                  </td>
                  <td className="py-2">
                    {/* Colour follows the row's actual bucket rather than a
                        hardcoded red, now that bucketing is computed live. */}
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        color: inv.bucketColor,
                        backgroundColor: `${inv.bucketColor}1A`,
                      }}
                    >
                      {inv.bucket}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No investments match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!ledgerComplete && (
          <p className="mt-3 text-[11px] text-slate-500">
            Only {ledgerShown} of {ledgerTotal} rows were visible in the source export
            before its table view was cut off &mdash; connect the full SABREFLEXX
            PAYABLES export to populate the remaining {ledgerTotal - ledgerShown}{" "}
            deposits.
          </p>
        )}
      </Card>
    </section>
  );
}
