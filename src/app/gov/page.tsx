import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOfficer } from "@/lib/officer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Award, ClipboardList, Plus, Store } from "lucide-react";
import TrustBadgeChip from "@/components/TrustBadgeChip";
import { evaluateKpis } from "@/lib/scoring/kpi";
import { psCode } from "@/lib/problemFields";

export default async function GovDashboard() {
  const officer = await getOfficer();
  if (!officer) redirect("/login");

  const departmentId = officer.departmentId ?? "__none__";

  const [problems, pitchStatusCounts, pendingPitches, pilots, solutionRequests] = await Promise.all([
    prisma.problem.findMany({ where: { departmentId }, select: { status: true } }),
    prisma.pitch.groupBy({ by: ["status"], where: { problem: { departmentId } }, _count: { _all: true } }),
    prisma.pitch.findMany({
      where: { problem: { departmentId }, status: "SUBMITTED" },
      include: { startup: { select: { companyName: true } }, problem: { select: { title: true, psNumber: true } } },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.pilot.findMany({
      where: { departmentId },
      include: {
        kpis: { include: { results: true } },
        pitch: { include: { startup: { select: { companyName: true } }, problem: { select: { title: true, psNumber: true } } } },
        passport: { select: { id: true } },
      },
    }),
    prisma.startupSolutionRequest.count({ where: { departmentId, status: "PENDING" } }),
  ]);

  const problemCounts = {
    total: problems.length,
    draft: problems.filter((p) => p.status === "DRAFT").length,
    published: problems.filter((p) => p.status === "PUBLISHED").length,
  };
  const pendingPitchCount = pitchStatusCounts.find((c) => c.status === "SUBMITTED")?._count._all ?? 0;

  const activePilots = pilots.filter((p) => p.status === "IN_PROGRESS");
  const completedPilots = pilots.filter((p) => p.status === "COMPLETED");
  const scoredCompleted = completedPilots.map((p) => ({ pilot: p, evaluation: evaluateKpis(p.kpis) }));
  const avgImpact = scoredCompleted.length
    ? scoredCompleted.reduce((sum, x) => sum + (x.evaluation.impactScore ?? 0), 0) / scoredCompleted.length
    : null;
  const readyForPassport = scoredCompleted.filter(
    ({ pilot, evaluation }) => !pilot.passport && evaluation.totalCount > 0 && evaluation.reportedCount === evaluation.totalCount
  );

  const attentionItems = [
    ...(pendingPitchCount > 0 ? [{ key: "pitches", href: "/gov/pitches", text: `${pendingPitchCount} pitch(es) awaiting your review` }] : []),
    ...readyForPassport.map(({ pilot }) => ({
      key: `passport-${pilot.id}`,
      href: `/gov/pilots/${pilot.id}`,
      text: `"${pilot.pitch.problem.title}" is fully reported — ready to generate a Solution Passport`,
    })),
    ...(solutionRequests > 0
      ? [{ key: "sol-req", href: "/marketplace", text: `${solutionRequests} startup solution request(s) your department sent are pending` }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">
          {officer.department?.name ?? "Your department"}
        </h1>
        <p className="text-slate-500">Your working dashboard — problems, pitches and pilots at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm text-slate-500">Problems posted</p>
            <p className="text-3xl font-semibold text-slate-900">{problemCounts.total}</p>
            <p className="text-xs text-slate-500">{problemCounts.published} published · {problemCounts.draft} drafts</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm text-slate-500">Pitches to review</p>
            <p className="text-3xl font-semibold text-slate-900">{pendingPitchCount}</p>
            <p className="text-xs text-slate-500">across all your problems</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm text-slate-500">Active pilots</p>
            <p className="text-3xl font-semibold text-slate-900">{activePilots.length}</p>
            <p className="text-xs text-slate-500">{completedPilots.length} completed</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm text-slate-500">Average impact score</p>
            <p className="text-3xl font-semibold text-slate-900">{avgImpact !== null ? avgImpact.toFixed(1) : "—"}</p>
            <p className="text-xs text-slate-500">across completed pilots</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {attentionItems.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-amber-900"><AlertCircle className="h-4 w-4" /> Needs your attention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {attentionItems.map((item) => (
                  <Link key={item.key} href={item.href} className="flex items-center justify-between rounded-md bg-white p-2.5 text-sm hover:bg-amber-100/50">
                    <span className="text-slate-700">{item.text}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Pitches awaiting review</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pendingPitches.length === 0 ? (
                <p className="text-sm text-slate-500">No pitches waiting on your review.</p>
              ) : (
                pendingPitches.map((p) => (
                  <Link key={p.id} href={`/gov/pitches/${p.id}`} className="flex items-center justify-between rounded-md border border-slate-100 p-3 hover:bg-slate-50">
                    <div>
                      <span className="mr-2 rounded bg-[#1B3A6B] px-1.5 py-0.5 font-mono text-xs font-semibold text-white">{psCode(p.problem.psNumber)}</span>
                      <span className="text-sm font-medium">{p.startup.companyName}</span>
                      <p className="text-xs text-slate-500">{p.problem.title}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Active pilots</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {activePilots.length === 0 ? (
                <p className="text-sm text-slate-500">No pilots in progress right now.</p>
              ) : (
                activePilots.map((p) => {
                  const evaluation = evaluateKpis(p.kpis);
                  return (
                    <Link key={p.id} href={`/gov/pilots/${p.id}`} className="flex items-center justify-between rounded-md border border-slate-100 p-3 hover:bg-slate-50">
                      <div>
                        <span className="mr-2 rounded bg-[#1B3A6B] px-1.5 py-0.5 font-mono text-xs font-semibold text-white">{psCode(p.pitch.problem.psNumber)}</span>
                        <span className="text-sm font-medium">{p.pitch.startup.companyName}</span>
                        <p className="text-xs text-slate-500">{evaluation.reportedCount} of {evaluation.totalCount} KPIs reported</p>
                      </div>
                      {evaluation.trustBadge && <TrustBadgeChip badge={evaluation.trustBadge} />}
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Quick actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Link href="/gov/problems/new"><Button variant="outline" className="w-full justify-start gap-2"><Plus className="h-4 w-4" /> Post New Problem</Button></Link>
              <Link href="/gov/pitches"><Button variant="outline" className="w-full justify-start gap-2"><ClipboardList className="h-4 w-4" /> Review Pitches</Button></Link>
              <Link href="/gov/pilots"><Button variant="outline" className="w-full justify-start gap-2"><Award className="h-4 w-4" /> Active Pilots</Button></Link>
              <Link href="/marketplace"><Button variant="outline" className="w-full justify-start gap-2"><Store className="h-4 w-4" /> Marketplace</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
