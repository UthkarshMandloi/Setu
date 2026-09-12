import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStartupProfile } from "@/lib/startup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import TrustBadgeChip from "@/components/TrustBadgeChip";
import { evaluateKpis } from "@/lib/scoring/kpi";
import { humanise } from "@/lib/format";
import { psCode } from "@/lib/problemFields";

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};

export default async function StartupPilotsPage() {
  const profile = await getStartupProfile();
  if (!profile) redirect("/login");

  const pilots = await prisma.pilot.findMany({
    where: { pitch: { startupId: profile.id } },
    include: {
      department: { select: { name: true, state: true } },
      pitch: { include: { problem: { select: { title: true, psNumber: true } } } },
      kpis: { include: { results: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">My Pilots</h1>
        <p className="text-slate-500">Pilots {profile.companyName} is running with government departments. Report KPI results with evidence here.</p>
      </div>

      {pilots.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-12 text-center text-slate-500">
            No pilots yet — a pilot starts when a department selects one of your pitches.{" "}
            <Link href="/problems" className="font-medium text-[#1B3A6B] hover:underline">Browse open problems</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pilots.map((pilot) => {
            const evaluation = evaluateKpis(pilot.kpis);
            const needsResults = pilot.status === "IN_PROGRESS" && evaluation.reportedCount < evaluation.totalCount;
            return (
              <Card key={pilot.id} className="border-slate-200 shadow-sm">
                <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#1B3A6B] px-2 py-0.5 font-mono text-xs font-semibold text-white">
                        {psCode(pilot.pitch.problem.psNumber)}
                      </span>
                      <Badge className={`${STATUS_TONE[pilot.status] ?? "bg-slate-100 text-slate-700"} border-0`}>{humanise(pilot.status)}</Badge>
                      {evaluation.trustBadge && <TrustBadgeChip badge={evaluation.trustBadge} />}
                    </div>
                    <p className="font-semibold text-slate-900">{pilot.pitch.problem.title}</p>
                    <p className="text-sm text-slate-500">
                      {pilot.department.name}
                      {pilot.department.state ? `, ${pilot.department.state}` : ""} · {evaluation.reportedCount} of {evaluation.totalCount} KPIs reported
                      {evaluation.impactScore !== null && ` · impact ${evaluation.impactScore}/100`}
                    </p>
                    {needsResults && <p className="text-xs font-medium text-amber-700">Results are awaited for some KPIs.</p>}
                  </div>
                  <Link href={`/startup/pilots/${pilot.id}`}>
                    <Button size="sm" className="gap-1 whitespace-nowrap bg-[#1B3A6B] hover:bg-[#142A4F]">
                      {pilot.status === "IN_PROGRESS" ? "Report results" : "Open workspace"} <ArrowRight size={14} />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
