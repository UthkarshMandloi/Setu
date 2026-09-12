import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStartupProfile } from "@/lib/startup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Bell, FileText, Lightbulb, Rocket, Sparkles } from "lucide-react";
import TrustBadgeChip from "@/components/TrustBadgeChip";
import { evaluateKpis } from "@/lib/scoring/kpi";
import { psCode } from "@/lib/problemFields";
import { SOLUTION_STATUS_META, type SolutionStatus } from "@/lib/solutionFields";

const VERIFICATION_TONE: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-800",
  NEEDS_REVIEW: "bg-yellow-100 text-yellow-800",
  REJECTED: "bg-red-100 text-red-800",
  PENDING: "bg-slate-100 text-slate-700",
};

export default async function StartupDashboard() {
  const profile = await getStartupProfile();
  if (!profile) redirect("/login");

  const [pitches, pilots, solutions, unreadCount] = await Promise.all([
    prisma.pitch.findMany({
      where: { startupId: profile.id },
      select: { status: true, problem: { select: { title: true, psNumber: true } }, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.pilot.findMany({
      where: { pitch: { startupId: profile.id } },
      include: { kpis: { include: { results: true } }, pitch: { include: { problem: { select: { title: true, psNumber: true } } } } },
    }),
    prisma.startupSolution.findMany({
      where: { startupId: profile.id },
      include: { requests: { where: { status: "PENDING" } } },
    }),
    prisma.notification.count({ where: { userId: profile.userId, isRead: false } }),
  ]);

  const pitchCounts = {
    total: pitches.length,
    submitted: pitches.filter((p) => p.status === "SUBMITTED").length,
    selected: pitches.filter((p) => p.status === "SELECTED").length,
  };
  const allPitches = await prisma.pitch.count({ where: { startupId: profile.id } });

  const activePilots = pilots.filter((p) => p.status === "IN_PROGRESS");
  const completedPilots = pilots.filter((p) => p.status === "COMPLETED");

  const pilotsNeedingResults = activePilots
    .map((p) => ({ pilot: p, evaluation: evaluateKpis(p.kpis) }))
    .filter(({ evaluation }) => evaluation.reportedCount < evaluation.totalCount);

  const pendingRequestCount = solutions.reduce((sum, s) => sum + s.requests.length, 0);
  const rejectedSolutions = solutions.filter((s) => s.status === "REJECTED");
  const solutionCounts = {
    draft: solutions.filter((s) => s.status === "DRAFT").length,
    pending: solutions.filter((s) => s.status === "PENDING").length,
    verified: solutions.filter((s) => s.status === "VERIFIED").length,
  };

  const attentionItems = [
    ...pilotsNeedingResults.map(({ pilot, evaluation }) => ({
      key: `pilot-${pilot.id}`,
      href: `/startup/pilots/${pilot.id}`,
      text: `${evaluation.totalCount - evaluation.reportedCount} KPI result(s) awaited for "${pilot.pitch.problem.title}"`,
    })),
    ...(pendingRequestCount > 0
      ? [{ key: "requests", href: "/startup/solutions", text: `${pendingRequestCount} department request(s) awaiting your response` }]
      : []),
    ...rejectedSolutions.map((s) => ({ key: `sol-${s.id}`, href: `/startup/solutions/${s.id}/edit`, text: `"${s.title}" needs changes before resubmitting` })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Welcome, {profile.companyName}</h1>
        <p className="text-slate-500">Your working dashboard — pitches, pilots and solutions at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-2 pt-5">
            <p className="text-sm text-slate-500">Verification status</p>
            <Badge className={`${VERIFICATION_TONE[profile.verificationStatus] ?? "bg-slate-100"} border-0`}>
              {profile.verificationStatus.replace("_", " ")}
            </Badge>
            <p className="text-xs text-slate-500">Eligibility score: {profile.eligibilityScore}/100</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm text-slate-500">Pitches</p>
            <p className="text-3xl font-semibold text-slate-900">{allPitches}</p>
            <p className="text-xs text-slate-500">{pitchCounts.submitted} under review · {pitchCounts.selected} selected</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm text-slate-500">Pilots</p>
            <p className="text-3xl font-semibold text-slate-900">{activePilots.length}<span className="text-base font-normal text-slate-500"> active</span></p>
            <p className="text-xs text-slate-500">{completedPilots.length} completed</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="space-y-1 pt-5">
            <p className="text-sm text-slate-500">Solutions listed</p>
            <p className="text-3xl font-semibold text-slate-900">{solutionCounts.verified}<span className="text-base font-normal text-slate-500"> verified</span></p>
            <p className="text-xs text-slate-500">{solutionCounts.pending} pending review · {solutionCounts.draft} drafts</p>
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
            <CardHeader><CardTitle className="text-lg">Active pilots</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {activePilots.length === 0 ? (
                <p className="text-sm text-slate-500">No active pilots right now.</p>
              ) : (
                activePilots.map((p) => {
                  const evaluation = evaluateKpis(p.kpis);
                  return (
                    <Link key={p.id} href={`/startup/pilots/${p.id}`} className="flex items-center justify-between rounded-md border border-slate-100 p-3 hover:bg-slate-50">
                      <div>
                        <span className="mr-2 rounded bg-[#1B3A6B] px-1.5 py-0.5 font-mono text-xs font-semibold text-white">{psCode(p.pitch.problem.psNumber)}</span>
                        <span className="text-sm font-medium">{p.pitch.problem.title}</span>
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
              <Link href="/problems"><Button variant="outline" className="w-full justify-start gap-2"><Rocket className="h-4 w-4" /> Find Problems</Button></Link>
              <Link href="/startup/solutions/new"><Button variant="outline" className="w-full justify-start gap-2"><Sparkles className="h-4 w-4" /> List a Solution</Button></Link>
              <Link href="/startup/pitches"><Button variant="outline" className="w-full justify-start gap-2"><FileText className="h-4 w-4" /> My Pitches</Button></Link>
              <Link href="/startup/profile"><Button variant="outline" className="w-full justify-start gap-2"><Lightbulb className="h-4 w-4" /> My Profile</Button></Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-4 w-4" /> Notifications</CardTitle></CardHeader>
            <CardContent>
              <Link href="/notifications" className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </CardContent>
          </Card>

          {pitches.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-lg">Recent pitches</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pitches.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate text-slate-700">{psCode(p.problem.psNumber)} {p.problem.title}</span>
                    <Badge variant="outline" className="ml-2 shrink-0 text-xs">{p.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
