import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canViewDepartment, getOfficer } from "@/lib/officer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Award, FileText, Paperclip, TrendingDown, TrendingUp } from "lucide-react";
import KpiAchievementChart, { type KpiChartDatum } from "@/components/charts/KpiAchievementChart";
import KpiStatusBadge from "@/components/KpiStatusBadge";
import TrustBadgeChip from "@/components/TrustBadgeChip";
import GeneratePassportButton from "./GeneratePassportButton";
import {
  evaluateKpis,
  roiPercent,
  KPI_STATUS_META,
  TRUST_BADGE_META,
  type KpiEvaluation,
  type KpiStatus,
  type TrustBadge,
} from "@/lib/scoring/kpi";
import { formatInr, humanise, withUnit } from "@/lib/format";
import { psCode } from "@/lib/problemFields";

const PILOT_STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};

const dateIN = (d: Date | null) => (d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null);

export default async function PilotMetricsPage({ params }: { params: { id: string } }) {
  const officer = await getOfficer();
  if (!officer) redirect("/login");

  const pilot = await prisma.pilot.findUnique({
    where: { id: params.id },
    include: {
      department: true,
      pitch: { include: { startup: true, problem: true } },
      kpis: { include: { results: true }, orderBy: { createdAt: "asc" } },
      passport: true,
    },
  });
  if (!pilot || !canViewDepartment(officer, pilot.departmentId)) notFound();

  const canManage = officer.departmentId === pilot.departmentId;
  const { problem, startup } = pilot.pitch;
  const evaluation = evaluateKpis(pilot.kpis);
  const roi = roiPercent(pilot.measuredBenefit, pilot.budget);
  const fullyReported = evaluation.totalCount > 0 && evaluation.reportedCount === evaluation.totalCount;
  const period = [dateIN(pilot.startDate), dateIN(pilot.endDate) ?? (pilot.status === "IN_PROGRESS" ? "ongoing" : null)]
    .filter(Boolean)
    .join(" → ");

  const chartData: KpiChartDatum[] = evaluation.kpis.map((k) => ({
    id: k.id,
    metric: k.metric,
    pct: k.achievementPct ?? 0,
    status: k.status,
    // Status is spelled out in the label so it never relies on bar colour alone.
    label: k.achievementPct === null ? "Awaiting result" : `${Math.round(k.achievementPct)}% · ${KPI_STATUS_META[k.status].label}`,
    target: withUnit(k.target, k.unit),
    actual: k.actual === null ? "not reported" : withUnit(k.actual, k.unit),
    direction: k.direction === "LOWER_IS_BETTER" ? "Lower is better" : "Higher is better",
  }));
  const legendStatuses: KpiStatus[] = ["MET", "PARTIAL", "NOT_MET", ...(evaluation.counts.PENDING ? (["PENDING"] as KpiStatus[]) : [])];

  return (
    <div className="space-y-6">
      <Link href="/gov/pilots" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#1B3A6B]">
        <ArrowLeft className="h-4 w-4" /> Active pilots
      </Link>

      <div className="space-y-2">
        <Link href={`/problems/${problem.id}`} className="inline-flex flex-wrap items-center gap-2 text-sm text-slate-500 hover:text-[#1B3A6B]">
          <span className="rounded bg-[#1B3A6B] px-2 py-0.5 font-mono text-xs font-semibold text-white">{psCode(problem.psNumber)}</span>
          {problem.title}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">{startup.companyName}</h1>
          <Badge className={`${PILOT_STATUS_TONE[pilot.status] ?? "bg-slate-100 text-slate-700"} border-0`}>{humanise(pilot.status)}</Badge>
          {evaluation.trustBadge && <TrustBadgeChip badge={evaluation.trustBadge} size="md" />}
        </div>
        <p className="text-sm text-slate-500">
          {pilot.department.name}
          {pilot.department.state ? `, ${pilot.department.state}` : ""}
          {period && ` · ${period}`}
          {!canManage && " · Evaluator view (read-only)"}
        </p>
      </div>

      {!fullyReported && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {evaluation.reportedCount === 0
            ? "No KPI results have been reported yet — scores appear once the startup submits actuals with evidence."
            : `Provisional scores: ${evaluation.reportedCount} of ${evaluation.totalCount} KPIs have reported results.`}
        </div>
      )}

      {/* Headline figures */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-3 pt-5">
            <p className="text-sm text-slate-500">Impact score</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-semibold text-slate-900">{evaluation.impactScore ?? "—"}</span>
              {evaluation.impactScore !== null && <span className="pb-1.5 text-sm text-slate-500">/ 100</span>}
            </div>
            <ScoreMeter score={evaluation.impactScore} badge={evaluation.trustBadge} />
            <p className="text-xs text-slate-500">Weighted achievement across KPIs, capped at 100</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-2 pt-5">
            <p className="text-sm text-slate-500">Return on investment</p>
            <div className="flex items-center gap-2">
              {roi !== null &&
                (roi >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-700" aria-hidden />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-700" aria-hidden />
                ))}
              <span className="text-4xl font-semibold text-slate-900">
                {roi === null ? "—" : `${roi >= 0 ? "+" : "−"}${Math.abs(roi).toFixed(1)}%`}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {roi === null
                ? "Needs the pilot cost and the measured benefit"
                : `Net ${roi >= 0 ? "gain" : "loss"} of ${formatInr(Math.abs((pilot.measuredBenefit ?? 0) - (pilot.budget ?? 0)))}`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-2 pt-5">
            <p className="text-sm text-slate-500">KPIs met</p>
            <p className="text-4xl font-semibold text-slate-900">
              {evaluation.counts.MET}
              <span className="text-lg font-normal text-slate-500"> of {evaluation.totalCount}</span>
            </p>
            <p className="text-xs text-slate-600">
              {[
                evaluation.counts.PARTIAL && `${evaluation.counts.PARTIAL} partial`,
                evaluation.counts.NOT_MET && `${evaluation.counts.NOT_MET} not met`,
                evaluation.counts.PENDING && `${evaluation.counts.PENDING} awaiting`,
              ]
                .filter(Boolean)
                .join(" · ") || "All targets met"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-2 pt-5">
            <p className="text-sm text-slate-500">Pilot cost vs measured benefit</p>
            <p className="text-2xl font-semibold text-slate-900">{formatInr(pilot.budget)}</p>
            <p className="text-sm text-slate-600">
              Benefit: <span className="font-medium text-slate-900">{formatInr(pilot.measuredBenefit)}</span>
            </p>
            <p className="text-xs text-slate-500">Officer-entered budget and measured benefit</p>
          </CardContent>
        </Card>
      </div>

      {/* Main comparison chart */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-3">
          <div>
            <CardTitle className="text-[#1B3A6B]">Target vs actual outcome</CardTitle>
            <CardDescription>
              Each bar is the actual outcome as a percentage of its agreed target. KPIs are measured in different units,
              so they share this common scale — the line at 100% is the target.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {legendStatuses.map((s) => (
              <KpiStatusBadge key={s} status={s} />
            ))}
            <span className="text-xs text-slate-500">Met ≥ 100% · Partial 50–99% · Not met &lt; 50%</span>
          </div>
        </CardHeader>
        <CardContent>
          {evaluation.totalCount === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No KPIs have been defined for this pilot yet.</p>
          ) : (
            <KpiAchievementChart data={chartData} />
          )}
          <p className="mt-2 text-xs text-slate-500">
            For lower-is-better KPIs (time, cost, error rates) achievement is target ÷ actual, so 100% always means the target was met.
          </p>
        </CardContent>
      </Card>

      {/* Per-KPI small multiples in their own units */}
      {evaluation.totalCount > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[#1B3A6B]">Target vs actual by KPI</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {evaluation.kpis.map((k) => (
              <KpiCard key={k.id} kpi={k} />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Table view: the accessible twin of the chart */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">KPI results table</CardTitle>
            <CardDescription>Every value from the charts, with weights and the latest evidence.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Achievement</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluation.kpis.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell>
                        <p className="font-medium">{k.metric}</p>
                        <p className="text-xs text-slate-500">{k.direction === "LOWER_IS_BETTER" ? "Lower is better" : "Higher is better"}</p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{withUnit(k.target, k.unit)}</TableCell>
                      <TableCell className="text-right tabular-nums">{k.actual === null ? "—" : withUnit(k.actual, k.unit)}</TableCell>
                      <TableCell className="text-right tabular-nums">{k.achievementPct === null ? "—" : `${k.achievementPct}%`}</TableCell>
                      <TableCell className="text-right tabular-nums">{k.weight}</TableCell>
                      <TableCell><KpiStatusBadge status={k.status} /></TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50 font-medium">
                    <TableCell colSpan={3}>Impact score (weighted, capped at 100)</TableCell>
                    <TableCell className="text-right tabular-nums">{evaluation.impactScore ?? "—"}</TableCell>
                    <TableCell />
                    <TableCell>{evaluation.trustBadge && <TrustBadgeChip badge={evaluation.trustBadge} />}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-[#D97706]" /> Solution Passport
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {pilot.passport ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <TrustBadgeChip badge={pilot.passport.trustBadge as TrustBadge} />
                    <Badge variant="outline">{pilot.passport.ipStatus === "OPEN" ? "Open IP" : "Proprietary"}</Badge>
                  </div>
                  <p className="text-slate-600">
                    Issued with impact score <span className="font-medium text-slate-900">{pilot.passport.impactScore}</span>
                    {pilot.passport.roiPercent !== null && (
                      <> and ROI <span className="font-medium text-slate-900">{pilot.passport.roiPercent.toFixed(1)}%</span></>
                    )}
                    .
                  </p>
                  {evaluation.impactScore !== null && Math.abs(evaluation.impactScore - pilot.passport.impactScore) >= 1 && (
                    <p className="text-xs text-slate-500">
                      The passport is a snapshot taken when it was issued; the live score from current results is {evaluation.impactScore}.
                    </p>
                  )}
                  <Link href={`/marketplace/${pilot.passport.id}`} className="inline-block font-medium text-[#1B3A6B] hover:underline">
                    View on marketplace →
                  </Link>
                </>
              ) : canManage && pilot.status === "COMPLETED" && fullyReported ? (
                <>
                  <p className="text-slate-600">
                    All KPIs are reported. Issue a passport so other departments can adopt this solution without a fresh pitch round.
                  </p>
                  <GeneratePassportButton pilotId={pilot.id} />
                </>
              ) : (
                <p className="text-slate-600">
                  {pilot.status !== "COMPLETED"
                    ? "A passport is issued once the pilot is completed and every KPI has a reported result."
                    : !fullyReported
                      ? "Every KPI needs a reported result before the passport can be issued."
                      : "Only officers of the owning department can issue the passport."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">How the score works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TRUST_BADGE_META) as TrustBadge[]).map((b) => (
                  <span key={b} className="inline-flex items-center gap-1.5">
                    <TrustBadgeChip badge={b} />
                    <span className="text-xs">{TRUST_BADGE_META[b].range}</span>
                  </span>
                ))}
              </div>
              <p>
                <span className="font-medium text-slate-800">ROI</span> = (measured benefit − pilot cost) ÷ pilot cost × 100
              </p>
              <p className="text-xs text-slate-500">
                Scores use the latest reported result for each KPI and are recalculated automatically whenever a new result arrives.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ScoreMeter({ score, badge }: { score: number | null; badge: TrustBadge | null }) {
  return (
    <div className="space-y-1.5">
      <div className="relative h-2 rounded-full bg-slate-100">
        {score !== null && badge && (
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${score}%`, background: TRUST_BADGE_META[badge].color }}
          />
        )}
        {/* Badge thresholds at 50 and 80 */}
        <div className="absolute -bottom-1 -top-1 w-px bg-slate-400" style={{ left: "50%" }} aria-hidden />
        <div className="absolute -bottom-1 -top-1 w-px bg-slate-400" style={{ left: "80%" }} aria-hidden />
      </div>
      {badge ? <TrustBadgeChip badge={badge} /> : <span className="text-xs text-slate-500">Not scored yet</span>}
    </div>
  );
}

function KpiCard({ kpi }: { kpi: KpiEvaluation }) {
  const scaleMax = Math.max(kpi.target, kpi.actual ?? 0) * 1.15 || 1;
  const pos = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`;
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-slate-900">{kpi.metric}</p>
            <p className="text-xs text-slate-500">
              {kpi.direction === "LOWER_IS_BETTER" ? "Lower is better" : "Higher is better"} · weight {kpi.weight}
            </p>
          </div>
          <KpiStatusBadge status={kpi.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Target</p>
            <p className="text-lg font-semibold text-slate-900">{withUnit(kpi.target, kpi.unit)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Actual</p>
            <p className="text-lg font-semibold text-slate-900">{kpi.actual === null ? "—" : withUnit(kpi.actual, kpi.unit)}</p>
          </div>
        </div>

        {/* Meter in the KPI's own units: fill = actual, dark tick = target */}
        <div className="relative h-2.5 rounded-full bg-slate-100" aria-hidden>
          {kpi.actual !== null && (
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: pos(kpi.actual), background: KPI_STATUS_META[kpi.status].color }}
            />
          )}
          <div className="absolute -bottom-1.5 -top-1.5 w-0.5 rounded bg-slate-800" style={{ left: pos(kpi.target) }} />
        </div>
        <p className="text-xs text-slate-500">
          {kpi.achievementPct === null ? "No result reported yet" : `${kpi.achievementPct}% of target`} · the dark tick marks the target
        </p>

        <div className="space-y-1 border-t pt-3 text-xs text-slate-600">
          <p className="flex items-start gap-1.5">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            {kpi.evidence || "No evidence note submitted"}
          </p>
          {kpi.attachmentUrl && (
            <a href={kpi.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#1B3A6B] hover:underline">
              <Paperclip className="h-3.5 w-3.5" aria-hidden /> Evidence attachment
            </a>
          )}
          {kpi.reportedAt && (
            <p className="text-slate-400">
              Reported {dateIN(kpi.reportedAt)}
              {kpi.resultCount > 1 && ` · ${kpi.resultCount} submissions (latest used)`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
