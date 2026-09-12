import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStartupProfile } from "@/lib/startup";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Award, FileText, Paperclip } from "lucide-react";
import KpiAchievementChart, { type KpiChartDatum } from "@/components/charts/KpiAchievementChart";
import KpiStatusBadge from "@/components/KpiStatusBadge";
import TrustBadgeChip from "@/components/TrustBadgeChip";
import KpiResultForm from "./KpiResultForm";
import { evaluateKpis, KPI_STATUS_META, type TrustBadge } from "@/lib/scoring/kpi";
import { humanise, withUnit } from "@/lib/format";
import { psCode } from "@/lib/problemFields";

const PILOT_STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};

const STATUS_NOTE: Record<string, { text: string; tone: string }> = {
  DRAFT: { text: "The department is still setting up this pilot. KPIs and agreements will appear here once it starts.", tone: "border-slate-300 bg-slate-50 text-slate-700" },
  IN_PROGRESS: { text: "Submit results as you measure them, with evidence. Scores update instantly and the department is notified.", tone: "border-blue-200 bg-blue-50 text-blue-900" },
  COMPLETED: { text: "This pilot is completed — results are locked.", tone: "border-green-200 bg-green-50 text-green-800" },
  CANCELLED: { text: "This pilot was cancelled.", tone: "border-slate-300 bg-slate-50 text-slate-700" },
};

const dateIN = (d: Date | null) => (d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null);

export default async function StartupPilotWorkspace({ params }: { params: { id: string } }) {
  const profile = await getStartupProfile();
  if (!profile) redirect("/login");

  const pilot = await prisma.pilot.findUnique({
    where: { id: params.id },
    include: {
      department: true,
      pitch: { include: { problem: true } },
      kpis: { include: { results: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "asc" } },
      passport: { select: { id: true, trustBadge: true } },
    },
  });
  // Startups only see their own pilots.
  if (!pilot || pilot.pitch.startupId !== profile.id) notFound();

  const open = pilot.status === "IN_PROGRESS";
  const evaluation = evaluateKpis(pilot.kpis);
  const history = new Map(pilot.kpis.map((k) => [k.id, k.results]));
  const note = STATUS_NOTE[pilot.status];
  const { problem } = pilot.pitch;

  const chartData: KpiChartDatum[] = evaluation.kpis.map((k) => ({
    id: k.id,
    metric: k.metric,
    pct: k.achievementPct ?? 0,
    status: k.status,
    label: k.achievementPct === null ? "Awaiting result" : `${Math.round(k.achievementPct)}% · ${KPI_STATUS_META[k.status].label}`,
    target: withUnit(k.target, k.unit),
    actual: k.actual === null ? "not reported" : withUnit(k.actual, k.unit),
    direction: k.direction === "LOWER_IS_BETTER" ? "Lower is better" : "Higher is better",
  }));

  return (
    <div className="space-y-6">
      <Link href="/startup/pilots" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#1B3A6B]">
        <ArrowLeft className="h-4 w-4" /> My pilots
      </Link>

      <div className="space-y-2">
        <Link href={`/problems/${problem.id}`} className="inline-flex flex-wrap items-center gap-2 text-sm text-slate-500 hover:text-[#1B3A6B]">
          <span className="rounded bg-[#1B3A6B] px-2 py-0.5 font-mono text-xs font-semibold text-white">{psCode(problem.psNumber)}</span>
          {problem.title}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Pilot workspace</h1>
          <Badge className={`${PILOT_STATUS_TONE[pilot.status] ?? "bg-slate-100 text-slate-700"} border-0`}>{humanise(pilot.status)}</Badge>
          {evaluation.trustBadge && <TrustBadgeChip badge={evaluation.trustBadge} size="md" />}
        </div>
        <p className="text-sm text-slate-500">
          With {pilot.department.name}
          {pilot.department.state ? `, ${pilot.department.state}` : ""}
          {pilot.startDate && ` · started ${dateIN(pilot.startDate)}`}
          {pilot.endDate && ` · ends ${dateIN(pilot.endDate)}`}
        </p>
      </div>

      {note && <div className={`rounded-md border p-3 text-sm ${note.tone}`}>{note.text}</div>}

      {evaluation.totalCount > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-2 pt-5">
              <p className="text-sm text-slate-500">{evaluation.reportedCount < evaluation.totalCount ? "Provisional impact score" : "Impact score"}</p>
              <p className="text-4xl font-semibold text-slate-900">
                {evaluation.impactScore ?? "—"}
                {evaluation.impactScore !== null && <span className="text-base font-normal text-slate-500"> / 100</span>}
              </p>
              {evaluation.trustBadge ? <TrustBadgeChip badge={evaluation.trustBadge} /> : <span className="text-xs text-slate-500">Not scored yet</span>}
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-2 pt-5">
              <p className="text-sm text-slate-500">KPIs met</p>
              <p className="text-4xl font-semibold text-slate-900">
                {evaluation.counts.MET}
                <span className="text-base font-normal text-slate-500"> of {evaluation.totalCount}</span>
              </p>
              <p className="text-xs text-slate-500">Met ≥ 100% of target · Partial 50–99% · Not met &lt; 50%</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-2 pt-5">
              <p className="text-sm text-slate-500">KPIs reported</p>
              <p className="text-4xl font-semibold text-slate-900">
                {evaluation.reportedCount}
                <span className="text-base font-normal text-slate-500"> of {evaluation.totalCount}</span>
              </p>
              <p className="text-xs text-slate-500">The latest submission for each KPI is used for scoring</p>
            </CardContent>
          </Card>
        </div>
      )}

      {evaluation.totalCount > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#1B3A6B]">Target vs actual outcome</CardTitle>
            <CardDescription>Your latest result for each KPI as a percentage of the agreed target. The line at 100% is the target.</CardDescription>
          </CardHeader>
          <CardContent>
            <KpiAchievementChart data={chartData} />
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#1B3A6B]">KPIs agreed with the department</h2>
        {evaluation.totalCount === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="py-8 text-center text-sm text-slate-500">No KPIs have been defined for this pilot yet.</CardContent>
          </Card>
        ) : (
          evaluation.kpis.map((k) => {
            const directionLabel = k.direction === "LOWER_IS_BETTER" ? "Lower is better" : "Higher is better";
            const results = history.get(k.id) ?? [];
            return (
              <Card key={k.id} className="border-slate-200 shadow-sm">
                <CardContent className="space-y-4 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{k.metric}</p>
                      <p className="text-xs text-slate-500">{directionLabel} · weight {k.weight}</p>
                    </div>
                    <KpiStatusBadge status={k.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Target</p>
                      <p className="text-lg font-semibold text-slate-900">{withUnit(k.target, k.unit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Latest actual</p>
                      <p className="text-lg font-semibold text-slate-900">{k.actual === null ? "—" : withUnit(k.actual, k.unit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Achievement</p>
                      <p className="text-lg font-semibold text-slate-900">{k.achievementPct === null ? "—" : `${k.achievementPct}%`}</p>
                    </div>
                  </div>

                  {open && <KpiResultForm kpiId={k.id} unit={k.unit} directionLabel={directionLabel} />}

                  {results.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submission history</p>
                      <ul className="divide-y rounded-md border border-slate-200">
                        {results.map((r, i) => (
                          <li key={r.id} className="space-y-1 p-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900">{withUnit(r.actual, k.unit)}</span>
                              <span className="text-xs text-slate-400">{dateIN(r.createdAt)}</span>
                              {i === 0 && <Badge variant="outline" className="text-[10px]">Used for scoring</Badge>}
                            </div>
                            {r.evidence && (
                              <p className="flex items-start gap-1.5 text-xs text-slate-600">
                                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                                {r.evidence}
                              </p>
                            )}
                            {r.attachmentUrl && (
                              <a href={r.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#1B3A6B] hover:underline">
                                <Paperclip className="h-3.5 w-3.5" aria-hidden /> Evidence file
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {pilot.passport && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <Award className="h-5 w-5 text-[#D97706]" aria-hidden /> A Solution Passport was issued for this pilot
              <TrustBadgeChip badge={pilot.passport.trustBadge as TrustBadge} />
            </p>
            <Link href={`/marketplace/${pilot.passport.id}`} className="text-sm font-medium text-[#1B3A6B] hover:underline">
              View on marketplace →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
