"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KPI_STATUS_META, type KpiStatus } from "@/lib/scoring/kpi";

export type KpiChartDatum = {
  id: string;
  metric: string;
  pct: number;
  status: KpiStatus;
  label: string;
  target: string;
  actual: string;
  direction: string;
};

// Chart chrome from the dataviz reference palette: text tokens for all text, hairline grid.
const INK_SECONDARY = "#52514e";
const INK_MUTED = "#898781";
const GRID = "#e1e0d9";
const BASELINE = "#c3c2b7";

/**
 * Every KPI has its own unit, so raw values can't share an axis. Each bar is the actual outcome
 * as a % of its target on one common scale; the reference line at 100% is the target.
 */
export default function KpiAchievementChart({ data }: { data: KpiChartDatum[] }) {
  const maxPct = Math.max(100, ...data.map((d) => d.pct));
  const domainMax = Math.ceil((maxPct + 15) / 25) * 25;
  const ticks = Array.from({ length: domainMax / 25 + 1 }, (_, i) => i * 25);
  const height = data.length * 56 + 56;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 24, right: 120, bottom: 4, left: 4 }} barCategoryGap={16}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis
            type="number"
            domain={[0, domainMax]}
            ticks={ticks}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: INK_MUTED, fontSize: 12 }}
            axisLine={{ stroke: BASELINE }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="metric"
            width={200}
            tick={{ fill: INK_SECONDARY, fontSize: 12 }}
            tickFormatter={(v: string) => (v.length > 30 ? `${v.slice(0, 29)}…` : v)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(27, 58, 107, 0.05)" }}
            content={({ active, payload }) => (
              <ChartTooltip active={active} datum={payload?.[0]?.payload as KpiChartDatum | undefined} />
            )}
          />
          <ReferenceLine
            x={100}
            stroke={INK_SECONDARY}
            strokeWidth={1.5}
            label={{ value: "Target (100%)", position: "top", fill: INK_SECONDARY, fontSize: 11 }}
          />
          <Bar dataKey="pct" barSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.id} fill={KPI_STATUS_META[d.status].color} />
            ))}
            <LabelList dataKey="label" position="right" fill={INK_SECONDARY} fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({ active, datum }: { active?: boolean; datum?: KpiChartDatum }) {
  if (!active || !datum) return null;
  const meta = KPI_STATUS_META[datum.status];
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-900">{datum.metric}</p>
      <p className="text-slate-600">
        Target: {datum.target} · Actual: {datum.actual}
      </p>
      <p className="text-slate-500">{datum.direction}</p>
      <p className="mt-1 flex items-center gap-1.5 font-medium text-slate-800">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: meta.color }} aria-hidden />
        {datum.status === "PENDING" ? meta.label : `${datum.label} of target · ${meta.label}`}
      </p>
    </div>
  );
}
