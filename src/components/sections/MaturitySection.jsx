import React, { Suspense } from "react";

import { Card, ChartSkeleton, SectionHeading } from "../ui";
import { DonutCard } from "../charts/lazy";
import { formatNaira } from "../../lib/format";

export default function MaturitySection({ buckets, totalPayable }) {
  return (
    <section>
      <SectionHeading
        eyebrow="Maturity Schedule"
        title="Payout obligations by time to maturity"
        subtitle="Amount the company must pay clients, bucketed by days remaining until maturity."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          {buckets.map((b) => (
            <Card key={b.key}>
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-sm font-medium text-slate-300">{b.label}</span>
              </div>
              <p className="mt-3 text-xl font-bold text-white">
                {formatNaira(b.payable)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {b.count} deposits &middot; {formatNaira(b.principal)} principal
              </p>
            </Card>
          ))}
        </div>
        <Suspense fallback={<Card><ChartSkeleton /></Card>}>
          <DonutCard
            title="Maturity distribution"
            subtitle="Share of total payable by bucket"
            centerLabel="Total payable"
            centerValue={totalPayable}
            data={buckets.map((b) => ({
              name: b.label,
              value: b.payable,
              color: b.color,
            }))}
            legend
          />
        </Suspense>
      </div>
    </section>
  );
}
