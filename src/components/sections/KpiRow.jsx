import React from "react";
import { Wallet, TrendingUp, Landmark, PiggyBank } from "lucide-react";

import { Card } from "../ui";
import { formatNaira } from "../../lib/format";

/**
 * The data layer returns stable ids; icon and accent are presentation and
 * live here, so a new KPI never means touching a selector.
 */
const KPI_STYLES = {
  invested:  { icon: PiggyBank,  accent: "text-blue-400 bg-blue-500/10" },
  payable:   { icon: TrendingUp, accent: "text-emerald-400 bg-emerald-500/10" },
  cash:      { icon: Landmark,   accent: "text-amber-400 bg-amber-500/10" },
  available: { icon: Wallet,     accent: "text-violet-400 bg-violet-500/10" },
};

function KpiCard({ kpi }) {
  const { icon: Icon, accent } = KPI_STYLES[kpi.id];
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold text-white tracking-tight">
        {formatNaira(kpi.value)}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-300">{kpi.label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{kpi.sub}</p>
    </Card>
  );
}

export default function KpiRow({ kpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => (
        <KpiCard key={k.id} kpi={k} />
      ))}
    </div>
  );
}
