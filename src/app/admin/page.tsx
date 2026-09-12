import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowRight, FileWarning, ShieldCheck, Sparkles } from "lucide-react";
import { humanise } from "@/lib/format";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  const [startupsToReview, pendingSolutions, pendingReports, recentLogs] = await Promise.all([
    prisma.startupProfile.count({ where: { verificationStatus: { in: ["NEEDS_REVIEW", "PENDING"] } } }),
    prisma.startupSolution.count({ where: { status: "PENDING" } }),
    prisma.unregisteredProblem.count({ where: { status: "PENDING" } }),
    prisma.auditLog.findMany({ include: { actor: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const queues = [
    { icon: ShieldCheck, tone: "text-blue-600", value: startupsToReview, label: "Startups awaiting verification", href: "/admin/verify" },
    { icon: Sparkles, tone: "text-[#D97706]", value: pendingSolutions, label: "Solutions awaiting review", href: "/admin/solutions" },
    { icon: FileWarning, tone: "text-amber-600", value: pendingReports, label: "Community reports pending", href: "/admin/community" },
  ];
  const totalPending = queues.reduce((sum, q) => sum + q.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Admin Dashboard</h1>
        <p className="text-slate-500">
          {totalPending > 0 ? `${totalPending} item${totalPending === 1 ? "" : "s"} across your review queues.` : "All queues are clear."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {queues.map((q) => (
          <Link key={q.label} href={q.href}>
            <Card className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <q.icon className={q.tone} size={22} aria-hidden />
                  <div className="text-2xl font-bold">{q.value}</div>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs font-medium text-slate-500">
                  {q.label} <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-4 w-4" /> Recent platform activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                <div>
                  <Badge variant="outline" className="mr-2 text-xs">{humanise(log.action)}</Badge>
                  <span className="text-slate-500">{log.actor?.name ?? "Unknown"}</span>
                </div>
                <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString("en-IN")}</span>
              </div>
            ))
          )}
          <Link href="/admin/audit-log" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#1B3A6B] hover:underline">
            View full audit log <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
