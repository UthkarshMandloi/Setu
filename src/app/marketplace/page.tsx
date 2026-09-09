import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckCircle2, TrendingUp, Users } from "lucide-react";

const prisma = new PrismaClient();

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const passports = await prisma.solutionPassport.findMany({
    where: { isPublished: true },
    include: {
      startup: { select: { companyName: true, sector: true } },
      pilot: {
        include: {
          pitch: {
            include: {
              problem: { select: { title: true, department: { select: { name: true, state: true } } } }
            }
          }
        }
      },
      marketplaceRequests: {
        include: { department: { select: { name: true } } }
      }
    },
    orderBy: { impactScore: "desc" }
  });

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "GREEN": return "bg-green-100 text-green-800 border-green-200";
      case "YELLOW": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "RED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Solution Marketplace</h1>
        <p className="text-slate-500 mt-1">Browse proven solutions with verified ROI. Request direct assignment without re-running procurement.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-600" size={20} />
              <div className="text-2xl font-bold">{passports.length}</div>
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Proven Solutions</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-[#D97706]" size={20} />
              <div className="text-2xl font-bold">
                {passports.length > 0 ? Math.round(passports.reduce((sum, p) => sum + (p.impactScore || 0), 0) / passports.length) : 0}%
              </div>
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Avg Impact Score</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" size={20} />
              <div className="text-2xl font-bold">
                {passports.reduce((sum, p) => sum + p.marketplaceRequests.length, 0)}
              </div>
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Reuse Requests</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {passports.map(passport => (
          <Card key={passport.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-[#1B3A6B]">{passport.title}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {passport.startup.companyName} • {passport.startup.sector}
                  </CardDescription>
                </div>
                <Badge className={`${getBadgeColor(passport.trustBadge)} text-xs`}>
                  {passport.trustBadge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600 line-clamp-2">{passport.summary}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-slate-500">Impact Score</span>
                  <div className="font-semibold text-lg">{passport.impactScore}%</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-slate-500">ROI</span>
                  <div className="font-semibold text-lg">
                    {passport.roiPercent !== null ? `${passport.roiPercent.toFixed(0)}%` : "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Badge variant="outline" className="text-xs">
                  {passport.ipStatus === "OPEN" ? "Open IP" : "Proprietary"}
                </Badge>
                {passport.pilot?.pitch?.problem?.department && (
                  <span>Deployed: {passport.pilot.pitch.problem.department.name}</span>
                )}
              </div>

              {passport.marketplaceRequests.length > 0 && (
                <div className="text-xs text-blue-600">
                  {passport.marketplaceRequests.length} reuse request(s)
                </div>
              )}

              <Link href={`/marketplace/${passport.id}`}>
                <Button className="w-full bg-[#1B3A6B] hover:bg-[#142A4F] mt-2">
                  View Details <ArrowRight size={14} className="ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {passports.length === 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-12 text-center text-slate-500">
            No proven solutions available yet. Complete pilots to generate passports.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
