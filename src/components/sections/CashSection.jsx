import React, { Suspense } from "react";

import { Card, ChartSkeleton, EstBadge, SectionHeading } from "../ui";
import { DonutCard } from "../charts/lazy";
import { formatNaira } from "../../lib/format";

const cashColors = [
  "#3B82F6", "#34D399", "#FBBF24", "#A78BFA", "#22D3EE",
  "#F87171", "#FB923C", "#818CF8", "#4ADE80", "#F472B6",
  "#93C5FD", "#FDE047", "#5EEAD4", "#C4B5FD",
];

export default function CashSection({ cash, totalCash }) {
  return (
    <section>
      <SectionHeading
        eyebrow="Cash Position"
        title="Bank & placement balances"
        subtitle="Breakdown of all cash holdings"
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="overflow-y-auto max-h-96">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800 sticky top-0 bg-slate-900">
                  <th className="py-2 font-medium">Account</th>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {cash.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/60">
                    <td className="py-2 pr-2 text-slate-300">
                      {c.account}
                      {c.estimated && <EstBadge />}
                    </td>
                    <td className="py-2 text-slate-500">{c.type}</td>
                    <td className="py-2 text-right font-medium text-slate-200">
                      {formatNaira(c.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-3 font-semibold text-white">Total</td>
                  <td />
                  <td className="pt-3 text-right font-bold text-white">
                    {formatNaira(totalCash)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {cash.some((c) => c.estimated) && (
            <p className="mt-3 text-[11px] text-slate-500">
              Accounts marked<EstBadge /> were reconstructed to reconcile the printed
              total &mdash; their rows were cut off in the source export.
            </p>
          )}
        </Card>
        <Suspense fallback={<Card><ChartSkeleton /></Card>}>
          <DonutCard
            title="Cash breakdown"
            subtitle="Distribution across accounts"
            centerLabel="Total cash"
            centerValue={totalCash}
            data={cash.map((c, i) => ({
              name: c.account,
              value: c.balance,
              color: cashColors[i % cashColors.length],
              estimated: c.estimated,
            }))}
            legend
          />
        </Suspense>
      </div>
    </section>
  );
}
