import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { Card, EstBadge } from "../ui";
import { compactNaira, formatNaira } from "../../lib/format";

export const TOOLTIP_STYLE = {
  background: "#0F172A",
  border: "1px solid #1E293B",
  borderRadius: 8,
  fontSize: 12,
};

export default function DonutCard({
  title,
  subtitle,
  data,
  centerLabel,
  centerValue,
  legend,
}) {
  return (
    <Card>
      <p className="text-sm font-semibold text-white">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      <div className="relative h-56 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatNaira(v)}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: "#E2E8F0" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-slate-500">{centerLabel}</span>
          <span className="text-base font-bold text-white">
            {compactNaira(centerValue)}
          </span>
        </div>
      </div>
      {legend && (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
          {data.map((d, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-slate-400 min-w-0"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="truncate">{d.name}</span>
              {d.estimated && <EstBadge />}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
