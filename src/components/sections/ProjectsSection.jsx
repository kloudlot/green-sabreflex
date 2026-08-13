import React, { useState } from "react";
import { Plus, X, RotateCcw, Upload, Check } from "lucide-react";

import { Card, SectionHeading } from "../ui";
import { formatNaira } from "../../lib/format";

export default function ProjectsSection({
  sheetProjects,
  availablePool,
  totalCash,
  nearTermPayable,
  canSave = false,
  onSave,
}) {
  // Project budgets are scenario inputs the user edits locally. They are
  // seeded from the sheet on mount and deliberately survive background
  // refreshes — "Reset" pulls the latest sheet values back in.
  const [projects, setProjects] = useState(sheetProjects);
  const [save, setSave] = useState({ state: "idle", message: null });

  const handleSave = async () => {
    setSave({ state: "saving", message: null });
    try {
      await onSave(projects);
      setSave({ state: "saved", message: null });
      setTimeout(() => setSave({ state: "idle", message: null }), 3000);
    } catch (err) {
      setSave({ state: "error", message: err.message ?? String(err) });
    }
  };

  const totalProjectBudget = projects.reduce(
    (s, p) => s + (Number(p.budget) || 0),
    0
  );
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
      { id: `local-${Date.now()}`, name: "New project", budget: 0 },
    ]);

  const resetProjects = () => setProjects(sheetProjects);

  return (
    <section>
      <SectionHeading
        eyebrow="Projects & Available Spend"
        title="Project funding vs available cash"
        subtitle={`Available pool = total cash (${formatNaira(totalCash)}) − <30-day maturity settlements (${formatNaira(nearTermPayable)}). Edit project names and budgets below — totals recalculate live.`}
      />
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Available pool
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              {formatNaira(availablePool)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total project budgets
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              {formatNaira(totalProjectBudget)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Remaining after projects
            </p>
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
                <th className="py-2 font-medium">Required / budgeted spend (₦)</th>
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
                      : "—"}
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
          {canSave && (
            <button
              onClick={handleSave}
              disabled={save.state === "saving"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              {save.state === "saved" ? (
                <>
                  <Check size={14} className="text-emerald-400" /> Saved
                </>
              ) : (
                <>
                  <Upload size={14} />
                  {save.state === "saving" ? "Saving…" : "Save to sheet"}
                </>
              )}
            </button>
          )}
        </div>

        {save.state === "error" && (
          <p className="mt-3 text-xs text-red-300">{save.message}</p>
        )}

        <p className="mt-3 text-[11px] text-slate-500">
          {canSave
            ? "Edits stay local until you press Save to sheet."
            : "Edits are scenario-only and are not written back to the sheet."}
        </p>
      </Card>
    </section>
  );
}
