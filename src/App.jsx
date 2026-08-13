import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  Landmark,
  PiggyBank,
  Search,
  Plus,
  X,
  RotateCcw,
  Building2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

const formatNaira = (n) =>
  `\u20A6${Math.round(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const compactNaira = (n) => {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${sign}\u20A6${(abs / 1_000_000_000).toFixed(1)}b`;
  if (abs >= 1_000_000) return `${sign}\u20A6${(abs / 1_000_000).toFixed(0)}m`;
  if (abs >= 1_000) return `${sign}\u20A6${(abs / 1_000).toFixed(0)}k`;
  return `${sign}\u20A6${abs}`;
};

/* ------------------------------------------------------------------ */
/*  Source data                                                        */
/*  Figures below are transcribed directly from the SabreFlexx export  */
/*  (SABREFLEXX PAYABLES JUL-DEC 2026.xlsx, as of 19 Jul 2026).        */
/*  Two categories are estimated because the source PDF cut them off   */
/*  before the full table/list could be captured — each is flagged     */
/*  with `estimated: true` below and called out in the UI.             */
/* ------------------------------------------------------------------ */

const AS_OF = "19 July 2026";

const kpis = [
  {
    label: "Total Investments Collected",
    value: 1_868_015_000,
    sub: "82 active deposits",
    icon: PiggyBank,
    accent: "text-blue-400 bg-blue-500/10",
  },
  {
    label: "Total Payable at Maturity",
    value: 2_486_560_650,
    sub: "Principal + ROI owed to clients",
    icon: TrendingUp,
    accent: "text-emerald-400 bg-emerald-500/10",
  },
  {
    label: "Total Cash Balances",
    value: 843_921_924,
    sub: "Banks + placements",
    icon: Landmark,
    accent: "text-amber-400 bg-amber-500/10",
  },
  {
    label: "Available to Spend on Projects",
    value: 212_748_174,
    sub: "Cash \u2212 <30-day maturities",
    icon: Wallet,
    accent: "text-violet-400 bg-violet-500/10",
  },
];

const maturityBuckets = [
  {
    key: "le30",
    label: "\u226430 days",
    payable: 631_173_750,
    count: 16,
    principal: 500_000_000,
    color: "#F87171",
  },
  {
    key: "31-60",
    label: "31\u201360 days",
    payable: 434_375_556,
    count: 14,
    principal: 318_632_500,
    color: "#FBBF24",
  },
  {
    key: "61-90",
    label: "61\u201390 days",
    payable: 200_264_069,
    count: 10,
    principal: 142_002_500,
    color: "#60A5FA",
  },
  {
    key: "90+",
    label: "90+ days",
    payable: 1_220_747_275,
    count: 42,
    principal: 907_380_000,
    color: "#34D399",
  },
];

const totalPayable = maturityBuckets.reduce((s, b) => s + b.payable, 0);

// Top-10 by volume: names + rank order are exact (from the "Top realtors by
// volume" bar chart), but the chart gave no numeric axis labels next to the
// bars — these values are estimated from bar length and flagged as such.
const topRealtors = [
  { name: "HAFBAM", invested: 465_000_000, estimated: true },
  { name: "ZIKAN", invested: 375_000_000, estimated: true },
  { name: "QUEEN OLIJE REALTY", invested: 195_000_000, estimated: true },
  { name: "ARINOLA", invested: 175_000_000, estimated: true },
  { name: "HAFBAM GLOBAL LTD", invested: 85_000_000, estimated: true },
  { name: "MADAM ALICE", invested: 78_000_000, estimated: true },
  { name: "QUEEN", invested: 65_000_000, estimated: true },
  { name: "PRING CITY REALTORS AND ESTATE LIMITED", invested: 55_000_000, estimated: true },
  { name: "BANIRE ADETOUN ELIZABETH", invested: 28_000_000, estimated: true },
  { name: "UNASSIGNED", invested: 22_000_000, estimated: true },
];

// Lower-volume realtors: exact figures as printed in the source table.
const otherRealtors = [
  { name: "MR. KADIRI", deposits: 1, invested: 5_500_000, atMaturity: 7_459_375 },
  { name: "MRS EROMOSELE EBERE JOY", deposits: 1, invested: 5_000_000, atMaturity: 6_900_000 },
  { name: "OLABISI TAIWO", deposits: 1, invested: 4_282_500, atMaturity: 6_113_269 },
  { name: "NAS", deposits: 1, invested: 4_000_000, atMaturity: 4_950_000 },
  { name: "DUNNI", deposits: 3, invested: 3_000_000, atMaturity: 3_285_000 },
  { name: "SOPHIA", deposits: 2, invested: 2_000_000, atMaturity: 2_600_000 },
  { name: "EGO", deposits: 1, invested: 2_000_000, atMaturity: 2_475_000 },
  { name: "MR TOLU", deposits: 1, invested: 2_000_000, atMaturity: 2_361_000 },
  { name: "MR KUNLE", deposits: 1, invested: 1_000_000, atMaturity: 1_380_000 },
];

const allRealtors = [
  ...topRealtors.map((r) => ({
    name: r.name,
    deposits: null,
    invested: r.invested,
    atMaturity: null,
    estimated: true,
  })),
  ...otherRealtors.map((r) => ({ ...r, estimated: false })),
].sort((a, b) => b.invested - a.invested);

// Cash position — BROADVIEW and SKY CAPITAL appear in the source donut
// legend but their rows were cut off the printed table. Their combined
// balance (\u20A6600,000,000 = total cash minus every other listed row) is
// split here as a placeholder in roughly the same proportion as their
// donut slices, and flagged `estimated: true`.
const cashPosition = [
  { name: "BROADVIEW", type: "Bank", amount: 420_000_000, estimated: true },
  { name: "SKY CAPITAL", type: "Bank", amount: 180_000_000, estimated: true },
  { name: "GTB Bank", type: "Bank", amount: 92_224_209, estimated: false },
  { name: "MD", type: "Placement", amount: 78_000_000, estimated: false },
  { name: "KEYSTONE BANK", type: "Bank", amount: 51_866_985, estimated: false },
  { name: "FCMB BANK", type: "Bank", amount: 7_326_106, estimated: false },
  { name: "UNITY BANK", type: "Bank", amount: 4_418_967, estimated: false },
  { name: "UBA BANK", type: "Bank", amount: 3_621_583, estimated: false },
  { name: "ALTERNATIVE BANK", type: "Bank", amount: 3_500_000, estimated: false },
  { name: "IMPERIAL MORTGAGE", type: "Placement", amount: 2_000_000, estimated: false },
  { name: "GTB", type: "Bank", amount: 500_000, estimated: false },
  { name: "ZENITH BANK", type: "Bank", amount: 397_913, estimated: false },
  { name: "FIDELITY BANK", type: "Bank", amount: 46_161, estimated: false },
  { name: "WEMA BANK", type: "Bank", amount: 20_000, estimated: false },
];

const totalCash = cashPosition.reduce((s, c) => s + c.amount, 0);

const cashColors = [
  "#3B82F6", "#34D399", "#FBBF24", "#A78BFA", "#22D3EE",
  "#F87171", "#FB923C", "#818CF8", "#4ADE80", "#F472B6",
  "#93C5FD", "#FDE047", "#5EEAD4", "#C4B5FD",
];

// Sample of the full 82-row investment ledger — only the rows visible in
// the source export before its table view was cut off (scrolled/paged).
const investmentsSample = [
  { customer: "SODIPO SAMSON OLAKUNLE", realtor: "HAFBAM", invested: 50_000_000, atMaturity: 62_500_000, maturityDate: "2026-07-19", daysLeft: 0, bucket: "\u226430 days" },
  { customer: "FASHINA KHADIJAT ABIOSE", realtor: "HAFBAM", invested: 100_000_000, atMaturity: 125_000_000, maturityDate: "2026-07-21", daysLeft: 2, bucket: "\u226430 days" },
  { customer: "MISS DAODU MODUPE OLUWABUNMI", realtor: "MADAM ALICE", invested: 5_000_000, atMaturity: 6_092_500, maturityDate: "2026-07-22", daysLeft: 3, bucket: "\u226430 days" },
  { customer: "MISS ELABOR REJOICE EHIZOMO", realtor: "DUNNI", invested: 1_000_000, atMaturity: 1_095_000, maturityDate: "2026-07-23", daysLeft: 4, bucket: "\u226430 days" },
  { customer: "FEHINTOLA JULIUS OLATOYE", realtor: "MADAM ALICE", invested: 20_000_000, atMaturity: 28_000_000, maturityDate: "2026-07-24", daysLeft: 5, bucket: "\u226430 days" },
  { customer: "AGBONTALOR ELIZABETH ODEGUA", realtor: "ZIKAN", invested: 17_000_000, atMaturity: 24_140_000, maturityDate: "2026-07-26", daysLeft: 7, bucket: "\u226430 days" },
  { customer: "MRS ATUNNISE ARINOLA", realtor: "ARINOLA", invested: 20_000_000, atMaturity: 24_000_000, maturityDate: "2026-07-27", daysLeft: 8, bucket: "\u226430 days" },
];

const defaultProjects = [
  { id: 1, name: "Lekki Phase 2 Estate", budget: 89_999_966 },
  { id: 2, name: "Ibeju-Lekki Land Acquisition", budget: 59_999_979 },
  { id: 3, name: "Ajah Terraces Development", budget: 40_000_000 },
  { id: 4, name: "Epe Commercial Plaza", budget: 20_000_000 },
];

const availablePool = totalCash - maturityBuckets[0].payable;

/* ------------------------------------------------------------------ */
/*  Small presentational pieces                                        */
/* ------------------------------------------------------------------ */

function SectionHeading({ eyebrow, title, subtitle }) {
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

function EstBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 align-middle">
      est.
    </span>
  );
}

function KpiCard({ kpi }) {
  const Icon = kpi.icon;
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${kpi.accent}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold text-white tracking-tight">
        {formatNaira(kpi.value)}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-300">{kpi.label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{kpi.sub}</p>
    </div>
  );
}

function DonutCard({ title, subtitle, data, centerLabel, centerValue, legend }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
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
              contentStyle={{
                background: "#0F172A",
                border: "1px solid #1E293B",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#E2E8F0" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-slate-500">{centerLabel}</span>
          <span className="text-base font-bold text-white">{compactNaira(centerValue)}</span>
        </div>
      </div>
      {legend && (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                      */
/* ------------------------------------------------------------------ */

export default function App() {
  const [realtorSearch, setRealtorSearch] = useState("");
  const [projects, setProjects] = useState(defaultProjects);
  const [invSearch, setInvSearch] = useState("");
  const [invBucket, setInvBucket] = useState("All maturities");
  const [invRealtor, setInvRealtor] = useState("All realtors");

  const filteredRealtors = useMemo(
    () =>
      allRealtors.filter((r) =>
        r.name.toLowerCase().includes(realtorSearch.toLowerCase())
      ),
    [realtorSearch]
  );

  const totalProjectBudget = projects.reduce((s, p) => s + (Number(p.budget) || 0), 0);
  const remainingAfterProjects = availablePool - totalProjectBudget;
  const usedPct = availablePool > 0 ? (totalProjectBudget / availablePool) * 100 : 0;

  const updateProject = (id, field, value) =>
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );

  const removeProject = (id) =>
    setProjects((prev) => prev.filter((p) => p.id !== id));

  const addProject = () =>
    setProjects((prev) => [
      ...prev,
      { id: Date.now(), name: "New project", budget: 0 },
    ]);

  const resetProjects = () => setProjects(defaultProjects);

  const realtorOptions = ["All realtors", ...new Set(investmentsSample.map((i) => i.realtor))];
  const bucketOptions = ["All maturities", ...maturityBuckets.map((b) => b.label)];

  const filteredInvestments = useMemo(
    () =>
      investmentsSample.filter((inv) => {
        const matchesSearch =
          inv.customer.toLowerCase().includes(invSearch.toLowerCase()) ||
          inv.realtor.toLowerCase().includes(invSearch.toLowerCase());
        const matchesBucket = invBucket === "All maturities" || inv.bucket === invBucket;
        const matchesRealtor = invRealtor === "All realtors" || inv.realtor === invRealtor;
        return matchesSearch && matchesBucket && matchesRealtor;
      }),
    [invSearch, invBucket, invRealtor]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
              SF
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                SabreFlexx Investment Dashboard
              </h1>
              <p className="text-sm text-slate-400">
                Real Estate Investment Deposits &middot; Payables Jul&ndash;Dec 2026
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300">
            As of {AS_OF}
          </span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <KpiCard key={k.label} kpi={k} />
          ))}
        </div>

        {/* Maturity schedule */}
        <section>
          <SectionHeading
            eyebrow="Maturity Schedule"
            title="Payout obligations by time to maturity"
            subtitle="Amount the company must pay clients, bucketed by days remaining until maturity."
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
              {maturityBuckets.map((b) => (
                <div
                  key={b.key}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
                >
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
                </div>
              ))}
            </div>
            <DonutCard
              title="Maturity distribution"
              subtitle="Share of total payable by bucket"
              centerLabel="Total payable"
              centerValue={totalPayable}
              data={maturityBuckets.map((b) => ({
                name: b.label,
                value: b.payable,
                color: b.color,
              }))}
              legend
            />
          </div>
        </section>

        {/* Realtor performance */}
        <section>
          <SectionHeading eyebrow="Realtor Performance" title="Top realtors by volume" subtitle="Total deposits sold" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topRealtors}
                    layout="vertical"
                    margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={compactNaira}
                      stroke="#475569"
                      fontSize={11}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                      stroke="#475569"
                      fontSize={11}
                      tick={{ fill: "#94A3B8" }}
                    />
                    <Tooltip
                      formatter={(v) => formatNaira(v)}
                      contentStyle={{
                        background: "#0F172A",
                        border: "1px solid #1E293B",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#E2E8F0" }}
                    />
                    <Bar dataKey="invested" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Bar values are estimated from the source chart proportions
                <EstBadge /> &mdash; wire up exact figures from the live export when available.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-white">All realtors</p>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={realtorSearch}
                    onChange={(e) => setRealtorSearch(e.target.value)}
                    placeholder="Search realtor..."
                    className="rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-72 -mx-5 px-5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-800">
                      <th className="py-2 font-medium">Realtor</th>
                      <th className="py-2 font-medium text-right">Deposits</th>
                      <th className="py-2 font-medium text-right">Invested</th>
                      <th className="py-2 font-medium text-right">At maturity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRealtors.map((r) => (
                      <tr key={r.name} className="border-b border-slate-800/60">
                        <td className="py-2 pr-2 text-slate-300">
                          {r.name}
                          {r.estimated && <EstBadge />}
                        </td>
                        <td className="py-2 text-right text-slate-400">{r.deposits ?? "\u2014"}</td>
                        <td className="py-2 text-right text-slate-300">{formatNaira(r.invested)}</td>
                        <td className="py-2 text-right text-slate-400">
                          {r.atMaturity ? formatNaira(r.atMaturity) : "\u2014"}
                        </td>
                      </tr>
                    ))}
                    {filteredRealtors.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500">
                          No realtors match &ldquo;{realtorSearch}&rdquo;
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Cash position */}
        <section>
          <SectionHeading eyebrow="Cash Position" title="Bank & placement balances" subtitle="Breakdown of all cash holdings" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
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
                    {cashPosition.map((c, i) => (
                      <tr key={i} className="border-b border-slate-800/60">
                        <td className="py-2 pr-2 text-slate-300">
                          {c.name}
                          {c.estimated && <EstBadge />}
                        </td>
                        <td className="py-2 text-slate-500">{c.type}</td>
                        <td className="py-2 text-right font-medium text-slate-200">
                          {formatNaira(c.amount)}
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
              <p className="mt-3 text-[11px] text-slate-500">
                BROADVIEW and SKY CAPITAL balances<EstBadge /> were reconstructed to reconcile
                the printed total &mdash; their rows were cut off in the source export.
              </p>
            </div>
            <DonutCard
              title="Cash breakdown"
              subtitle="Distribution across accounts"
              centerLabel="Total cash"
              centerValue={totalCash}
              data={cashPosition.map((c, i) => ({
                name: c.name,
                value: c.amount,
                color: cashColors[i % cashColors.length],
                estimated: c.estimated,
              }))}
              legend
            />
          </div>
        </section>

        {/* Projects & available spend */}
        <section>
          <SectionHeading
            eyebrow="Projects & Available Spend"
            title="Project funding vs available cash"
            subtitle={`Available pool = total cash (${formatNaira(totalCash)}) \u2212 <30-day maturity settlements (${formatNaira(maturityBuckets[0].payable)}). Edit project names and budgets below \u2014 totals recalculate live.`}
          />
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Available pool</p>
                <p className="mt-1 text-lg font-bold text-white">{formatNaira(availablePool)}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total project budgets</p>
                <p className="mt-1 text-lg font-bold text-white">{formatNaira(totalProjectBudget)}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Remaining after projects</p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    remainingAfterProjects < 0 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {formatNaira(remainingAfterProjects)}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800">
                  <div
                    className={`h-1.5 rounded-full ${
                      usedPct > 100 ? "bg-red-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(usedPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                    <th className="py-2 font-medium">Project</th>
                    <th className="py-2 font-medium">Required / budgeted spend (\u20A6)</th>
                    <th className="py-2 font-medium text-right">% of pool</th>
                    <th className="py-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800/60">
                      <td className="py-2 pr-3">
                        <input
                          value={p.name}
                          onChange={(e) => updateProject(p.id, "name", e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          value={p.budget}
                          onChange={(e) =>
                            updateProject(p.id, "budget", Number(e.target.value) || 0)
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 text-right text-slate-400 whitespace-nowrap">
                        {availablePool > 0
                          ? `${((p.budget / availablePool) * 100).toFixed(1)}%`
                          : "\u2014"}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => removeProject(p.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-400"
                          aria-label={`Remove ${p.name}`}
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={addProject}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
              >
                <Plus size={14} /> Add project
              </button>
              <button
                onClick={resetProjects}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          </div>
        </section>

        {/* All investments */}
        <section>
          <SectionHeading eyebrow="All Investments" title="Investment ledger" subtitle="Search, filter, and drill into individual deposits" />
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  placeholder="Search customer or realtor..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-8 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <select
                value={invBucket}
                onChange={(e) => setInvBucket(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {bucketOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <select
                value={invRealtor}
                onChange={(e) => setInvRealtor(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {realtorOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <span className="inline-flex items-center rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-500">
                {filteredInvestments.length} of 82 shown
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                    <th className="py-2 pr-3 font-medium">Customer</th>
                    <th className="py-2 pr-3 font-medium">Realtor</th>
                    <th className="py-2 pr-3 font-medium text-right">Invested (\u20A6)</th>
                    <th className="py-2 pr-3 font-medium text-right">At maturity (\u20A6)</th>
                    <th className="py-2 pr-3 font-medium">Maturity date</th>
                    <th className="py-2 pr-3 font-medium text-right">Days left</th>
                    <th className="py-2 font-medium">Bucket</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestments.map((inv, i) => (
                    <tr key={i} className="border-b border-slate-800/60">
                      <td className="py-2 pr-3 text-slate-200">{inv.customer}</td>
                      <td className="py-2 pr-3 text-slate-400">{inv.realtor}</td>
                      <td className="py-2 pr-3 text-right text-slate-300">
                        {formatNaira(inv.invested)}
                      </td>
                      <td className="py-2 pr-3 text-right font-medium text-slate-200">
                        {formatNaira(inv.atMaturity)}
                      </td>
                      <td className="py-2 pr-3 text-slate-400">
                        {new Date(inv.maturityDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2 pr-3 text-right text-slate-400">{inv.daysLeft}</td>
                      <td className="py-2">
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                          {inv.bucket}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredInvestments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        No investments match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Only 7 of 82 rows were visible in the source export before its table view was cut
              off &mdash; connect the full SABREFLEXX PAYABLES export to populate the remaining
              75 deposits.
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-2 pb-6">
          <Building2 size={14} className="text-slate-600" />
          <p className="text-xs text-slate-500">
            Generated from SABREFLEXX PAYABLES JUL-DEC 2026.xlsx &middot; Figures in Nigerian
            Naira (\u20A6) &middot; Project budgets are editable placeholders
          </p>
        </div>
      </div>
    </div>
  );
}
