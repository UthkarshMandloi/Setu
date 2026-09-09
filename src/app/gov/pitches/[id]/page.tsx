import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PitchActions from "./PitchActions";

const prisma = new PrismaClient();

export default async function PitchDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  const pitch = await prisma.pitch.findUnique({
    where: { id: params.id },
    include: {
      problem: { include: { department: true } },
      startup: true
    }
  });

  if (!pitch) notFound();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SELECTED": return "bg-green-100 text-green-800";
      case "SHORTLISTED": return "bg-blue-100 text-blue-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge className={`${getStatusColor(pitch.status)} border-0`}>{pitch.status}</Badge>
        <h1 className="text-2xl font-bold">{pitch.startup.companyName}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Solution Summary</CardTitle>
              <CardDescription>Submitted by {pitch.startup.companyName}</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>{pitch.solutionSummary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Problem Context</CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold">{pitch.problem.title}</h4>
              <p className="text-sm text-slate-600 mt-1">{pitch.problem.description}</p>
              <div className="mt-3 text-sm text-slate-500">
                {pitch.problem.department?.name} • {pitch.problem.department?.state}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50 border-slate-200 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Startup Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500">Company:</span>
                <p className="font-medium">{pitch.startup.companyName}</p>
              </div>
              <div>
                <span className="text-slate-500">Sector:</span>
                <p className="font-medium">{pitch.startup.sector || "N/A"}</p>
              </div>
              <div>
                <span className="text-slate-500">Verification:</span>
                <p className="font-medium">
                  <Badge variant="outline">{pitch.startup.verificationStatus}</Badge>
                </p>
              </div>
              <div>
                <span className="text-slate-500">Eligibility Score:</span>
                <p className="font-medium text-lg">{pitch.startup.eligibilityScore}/100</p>
              </div>
              <div>
                <span className="text-slate-500">Tech Readiness:</span>
                <p className="font-medium">TRL {pitch.techReadinessLevel}/9</p>
              </div>
              {pitch.team && (
                <div>
                  <span className="text-slate-500">Team:</span>
                  <p className="font-medium">{pitch.team}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {pitch.status === "SUBMITTED" && (
            <PitchActions pitchId={pitch.id} problemId={pitch.problemId} />
          )}
        </div>
      </div>
    </div>
  );
}
