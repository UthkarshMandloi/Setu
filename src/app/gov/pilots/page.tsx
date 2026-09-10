import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";



export default async function PilotListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  const pilots = await prisma.pilot.findMany({
    include: {
      pitch: {
        include: {
          startup: { select: { companyName: true } },
          problem: { select: { title: true } }
        }
      },
      kpis: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Pilot Program</h1>
        <p className="text-slate-500">Track government-startup pilot results, KPI achievement, and ROI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Active Pilots", value: pilots.filter(p => p.status === "IN_PROGRESS").length, color: "bg-blue-50 text-blue-700" },
          { label: "Completed", value: pilots.filter(p => p.status === "COMPLETED").length, color: "bg-green-50 text-green-700" },
          { label: "Passports Created", value: pilots.filter(p => p.status === "COMPLETED").length, color: "bg-saffron-50 text-[#D97706]" },
        ].map(stat => (
          <Card key={stat.label} className="border-slate-200 shadow-sm">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs font-medium text-slate-500 mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {pilots.map(pilot => (
          <Card key={pilot.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#1B3A6B]">{pilot.pitch?.problem?.title || "Untitled Pilot"}</h3>
                <p className="text-sm text-slate-500">{pilot.pitch?.startup?.companyName || "Unknown Startup"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${
                    pilot.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                    pilot.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  } border-0 text-xs`}>
                    {pilot.status}
                  </Badge>
                  <span className="text-xs text-slate-400">Budget: ₹{pilot.budget?.toLocaleString() || "—"}</span>
                </div>
              </div>
              <Link href={`/gov/pilots/${pilot.id}`}>
                <Button size="sm" variant="outline" className="gap-1">
                  View Metrics <ArrowRight size={14} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
