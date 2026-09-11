import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOfficer } from "@/lib/officer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight } from "lucide-react";
import TrustBadgeChip from "@/components/TrustBadgeChip";
import { evaluateKpis, roiPercent } from "@/lib/scoring/kpi";
import { formatInr, humanise } from "@/lib/format";
import { psCode } from "@/lib/problemFields";

const PILOT_STATUSES = ["DRAFT", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const BADGE_FILTERS = ["GREEN", "YELLOW", "RED", "UNSCORED"];
const SORTS = ["newest", "impact", "roi", "budget"];

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};

const FIELD = "h-9 w-full rounded-md border border-input bg-white px-2 text-sm shadow-sm";
const LABEL = "mb-1 block text-xs font-medium text-slate-600";

type Search = { q?: string; status?: string; badge?: string; dept?: string; sort?: string };

function hrefWith(current: Search, patch: Partial<Search>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (typeof value === "string" && value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/gov/pilots?${qs}` : "/gov/pilots";
}

// Missing values sort last in descending order.
const desc = (a: number | null | undefined, b: number | null | undefined) => (b ?? -1e15) - (a ?? -1e15);

export default async function PilotListPage({ searchParams }: { searchParams: Search }) {
  const officer = await getOfficer();
  if (!officer) redirect("/login");

  // ASSUMPTION (see canViewDepartment in lib/officer.ts): GOV_ADMIN evaluators see every department.
  const isEvaluator = officer.role === "GOV_ADMIN";
  const q = searchParams.q?.trim() ?? "";
  const status = PILOT_STATUSES.includes(searchParams.status ?? "") ? searchParams.status! : "";
  const badge = BADGE_FILTERS.includes(searchParams.badge ?? "") ? searchParams.badge! : "";
  const sort = SORTS.includes(searchParams.sort ?? "") ? searchParams.sort! : "newest";
  const dept = isEvaluator ? searchParams.dept ?? "" : "";

  const scope: Prisma.PilotWhereInput = isEvaluator
    ? dept ? { departmentId: dept } : {}
    : { departmentId: officer.departmentId ?? "__none__" };

  const [pilots, departments] = await Promise.all([
    prisma.pilot.findMany({
      where: scope,
      include: {
        department: { select: { name: true } },
        pitch: {
          include: {
            startup: { select: { companyName: true } },
            problem: { select: { id: true, title: true, psNumber: true } },
          },
        },
        kpis: { include: { results: true } },
        passport: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    isEvaluator
      ? prisma.department.findMany({ where: { pilots: { some: {} } }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);

  // Scores are computed live from KPI results, so badge filters and score sorts run after scoring.
  const rows = pilots.map((pilot) => ({
    pilot,
    evaluation: evaluateKpis(pilot.kpis),
    roi: roiPercent(pilot.measuredBenefit, pilot.budget),
  }));

  const completedScores = rows
    .filter((r) => r.pilot.status === "COMPLETED" && r.evaluation.impactScore !== null)
    .map((r) => r.evaluation.impactScore as number);
  const stats = [
    { label: "Active pilots", value: String(rows.filter((r) => r.pilot.status === "IN_PROGRESS").length) },
    { label: "Completed", value: String(rows.filter((r) => r.pilot.status === "COMPLETED").length) },
    {
      label: "Average impact (completed)",
      value: completedScores.length ? (completedScores.reduce((a, b) => a + b, 0) / completedScores.length).toFixed(1) : "—",
    },
    { label: "Passports issued", value: String(rows.filter((r) => r.pilot.passport).length) },
  ];

  const psMatch = q.match(/^ps-?0*(\d+)$/i);
  const needle = q.toLowerCase();
  const matchesSearch = (r: (typeof rows)[number]) =>
    !q ||
    (psMatch
      ? r.pilot.pitch.problem.psNumber === Number(psMatch[1])
      : [r.pilot.pitch.startup.companyName, r.pilot.pitch.problem.title, psCode(r.pilot.pitch.problem.psNumber)].some((s) =>
          s.toLowerCase().includes(needle)
        ));
  const matchesBadge = (r: (typeof rows)[number]) =>
    !badge || (badge === "UNSCORED" ? r.evaluation.trustBadge === null : r.evaluation.trustBadge === badge);

  const beforeStatus = rows.filter((r) => matchesSearch(r) && matchesBadge(r));
  const filtered = beforeStatus.filter((r) => !status || r.pilot.status === status);
  if (sort === "impact") filtered.sort((a, b) => desc(a.evaluation.impactScore, b.evaluation.impactScore));
  if (sort === "roi") filtered.sort((a, b) => desc(a.roi, b.roi));
  if (sort === "budget") filtered.sort((a, b) => desc(a.pilot.budget, b.pilot.budget));

  const filtersActive = !!(q || status || badge || dept);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Pilot Programme</h1>
        <p className="text-slate-500">
          {isEvaluator
            ? "Evaluator view — pilots across all departments. KPI achievement, impact score and ROI are calculated live."
            : `Pilots run by ${officer.department?.name ?? "your department"}. KPI achievement, impact score and ROI are calculated live.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
              <div className="mt-1 text-xs font-medium text-slate-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusChip href={hrefWith(searchParams, { status: undefined })} active={!status} label="All" count={beforeStatus.length} />
        {PILOT_STATUSES.map((s) => (
          <StatusChip
            key={s}
            href={hrefWith(searchParams, { status: s })}
            active={status === s}
            label={humanise(s)}
            count={beforeStatus.filter((r) => r.pilot.status === s).length}
          />
        ))}
      </div>

      <form method="get" className="grid grid-cols-1 gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-6">
        <div className="md:col-span-2">
          <label className={LABEL} htmlFor="q">Search</label>
          <Input id="q" name="q" defaultValue={q} placeholder="Startup, problem or PS ID" className="bg-white" />
        </div>
        <div>
          <label className={LABEL} htmlFor="status">Pilot status</label>
          <select id="status" name="status" defaultValue={status} className={FIELD}>
            <option value="">Any status</option>
            {PILOT_STATUSES.map((s) => (
              <option key={s} value={s}>{humanise(s)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="badge">Trust badge</label>
          <select id="badge" name="badge" defaultValue={badge} className={FIELD}>
            <option value="">Any badge</option>
            <option value="GREEN">Green (80–100)</option>
            <option value="YELLOW">Yellow (50–79)</option>
            <option value="RED">Red (0–49)</option>
            <option value="UNSCORED">Not scored yet</option>
          </select>
        </div>
        {isEvaluator && (
          <div>
            <label className={LABEL} htmlFor="dept">Department</label>
            <select id="dept" name="dept" defaultValue={dept} className={FIELD}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={LABEL} htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" defaultValue={sort} className={FIELD}>
            <option value="newest">Newest first</option>
            <option value="impact">Highest impact score</option>
            <option value="roi">Highest ROI</option>
            <option value="budget">Largest budget</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm" className="bg-[#1B3A6B] hover:bg-[#142A4F]">Apply filters</Button>
          {filtersActive && (
            <Link href="/gov/pilots">
              <Button type="button" size="sm" variant="ghost">Clear</Button>
            </Link>
          )}
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-md border bg-white p-10 text-center text-slate-500 shadow-sm">
          {filtersActive ? "No pilots match these filters." : "No pilots yet — pilots start when an officer selects a winning pitch."}
        </div>
      ) : (
        <div className="rounded-md border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pilot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">KPIs reported</TableHead>
                  <TableHead className="text-right">Impact</TableHead>
                  <TableHead>Trust badge</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ pilot, evaluation, roi }) => (
                  <TableRow key={pilot.id}>
                    <TableCell className="max-w-md">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-[#1B3A6B] px-2 py-0.5 font-mono text-xs font-semibold text-white">
                          {psCode(pilot.pitch.problem.psNumber)}
                        </span>
                        <span className="font-medium text-slate-900">{pilot.pitch.startup.companyName}</span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-600">{pilot.pitch.problem.title}</p>
                      {isEvaluator && <p className="text-xs text-slate-400">{pilot.department.name}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_TONE[pilot.status] ?? "bg-slate-100 text-slate-700"} whitespace-nowrap border-0`}>
                        {humanise(pilot.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {evaluation.reportedCount} / {evaluation.totalCount}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{evaluation.impactScore ?? "—"}</TableCell>
                    <TableCell>
                      {evaluation.trustBadge ? (
                        <TrustBadgeChip badge={evaluation.trustBadge} />
                      ) : (
                        <span className="text-xs text-slate-500">Not scored yet</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {roi === null ? "—" : `${roi >= 0 ? "+" : "−"}${Math.abs(roi).toFixed(1)}%`}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">{formatInr(pilot.budget)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/gov/pilots/${pilot.id}`}>
                        <Button size="sm" variant="outline" className="gap-1 whitespace-nowrap">
                          View metrics <ArrowRight size={14} />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
        active ? "border-[#1B3A6B] bg-[#1B3A6B] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-xs font-semibold ${active ? "bg-white/20" : "bg-slate-100"}`}>{count}</span>
    </Link>
  );
}
