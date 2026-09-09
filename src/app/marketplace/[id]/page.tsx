import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import RequestAssignmentForm from "./RequestAssignmentForm";

const prisma = new PrismaClient();

export default async function PassportDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const passport = await prisma.solutionPassport.findUnique({
    where: { id: params.id },
    include: {
      startup: { select: { companyName: true, sector: true, description: true } },
      pilot: {
        include: {
          pitch: {
            include: {
              problem: { select: { title: true, description: true, department: { select: { name: true, state: true } } } }
            }
          },
          kpis: {
            include: { results: true }
          }
        }
      },
      marketplaceRequests: {
        include: { department: { select: { name: true, state: true } } },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!passport) notFound();

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "GREEN": return "bg-green-100 text-green-800";
      case "YELLOW": return "bg-yellow-100 text-yellow-800";
      case "RED": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const canRequestAssignment =
    (session.user as any).role === "GOV_OFFICER" ||
    (session.user as any).role === "GOV_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`${getBadgeColor(passport.trustBadge)} border-0`}>
              {passport.trustBadge} Badge
            </Badge>
            <Badge variant="outline">
              {passport.ipStatus === "OPEN" ? "Open IP" : "Proprietary"}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">{passport.title}</h1>
          <p className="text-slate-500 mt-1">{passport.startup.companyName} • {passport.startup.sector}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Solution Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">{passport.summary}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Original Problem</CardTitle>
              <CardDescription>
                {passport.pilot?.pitch?.problem?.department?.name} • {passport.pilot?.pitch?.problem?.department?.state}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold mb-2">{passport.pilot?.pitch?.problem?.title}</h4>
              <p className="text-sm text-slate-600">{passport.pilot?.pitch?.problem?.description}</p>
            </CardContent>
          </Card>

          {passport.pilot?.kpis && passport.pilot.kpis.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">KPI Achievement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {passport.pilot.kpis.map(kpi => {
                    const result = kpi.results?.[0];
                    const achieved = result?.actual || 0;
                    const percentage = kpi.target > 0
                      ? (kpi.direction === "HIGHER_IS_BETTER"
                          ? Math.min(100, (achieved / kpi.target) * 100)
                          : Math.min(100, (kpi.target / achieved) * 100))
                      : 0;

                    return (
                      <div key={kpi.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="font-medium text-sm">{kpi.metric}</p>
                          <p className="text-xs text-slate-500">
                            Target: {kpi.target} {kpi.unit} • Achieved: {achieved} {kpi.unit}
                          </p>
                        </div>
                        <Badge variant={percentage >= 100 ? "default" : percentage >= 50 ? "secondary" : "destructive"}>
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-slate-50">
            <CardHeader>
              <CardTitle className="text-lg">Impact Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-slate-500">Impact Score</span>
                <div className="text-3xl font-bold text-[#1B3A6B]">{passport.impactScore}%</div>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-slate-500">ROI</span>
                <div className={`text-3xl font-bold ${(passport.roiPercent || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {passport.roiPercent !== null ? `${passport.roiPercent.toFixed(1)}%` : "—"}
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-slate-500">Budget Deployed</span>
                <div className="text-lg font-semibold">
                  ₹{passport.pilot?.budget?.toLocaleString() || "—"}
                </div>
              </div>
            </CardContent>
          </Card>

          {canRequestAssignment && (
            <RequestAssignmentForm
              passportId={passport.id}
              existingRequests={passport.marketplaceRequests}
            />
          )}

          {passport.marketplaceRequests.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Reuse Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {passport.marketplaceRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{req.department.name}</p>
                      <p className="text-xs text-slate-500">{req.notes || "No notes"}</p>
                    </div>
                    <Badge variant={req.status === "ACCEPTED" ? "default" : req.status === "REJECTED" ? "destructive" : "secondary"}>
                      {req.status}
                    </Badge>
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
