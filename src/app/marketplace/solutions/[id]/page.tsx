import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import RequestSolutionForm from "./RequestSolutionForm";
import { toLines } from "@/lib/problemFields";

export default async function SolutionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const solution = await prisma.startupSolution.findUnique({
    where: { id: params.id },
    include: {
      startup: { select: { companyName: true, sector: true, website: true } },
      requests: { include: { department: { select: { name: true, state: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!solution || solution.status !== "VERIFIED" || !solution.isListed) notFound();

  const features = toLines(solution.keyFeatures);
  const proof = toLines(solution.deploymentProof);
  const canRequest = ["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge className="border-0 bg-blue-100 text-blue-800 gap-1"><ShieldCheck size={12} /> Platform Verified</Badge>
          {solution.sector && <Badge variant="outline">{solution.sector}</Badge>}
          <Badge variant="outline" className="text-slate-500">Not yet piloted through PilotSetu</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">{solution.title}</h1>
        <p className="text-slate-500 mt-1">{solution.startup.companyName} • {solution.startup.sector}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-lg">What it does</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-line text-slate-600">{solution.description}</p></CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Problem it solves</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-line text-slate-600">{solution.problemSolved}</p></CardContent>
          </Card>

          {features.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-lg">Key features</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          {proof.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-lg">Existing deployments / proof</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {proof.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          {solution.evidenceUrl && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-lg">Evidence</CardTitle></CardHeader>
              <CardContent>
                <a href={solution.evidenceUrl} target="_blank" rel="noreferrer" className="break-all text-sm text-[#1B3A6B] hover:underline">
                  {solution.evidenceUrl}
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-slate-50">
            <CardHeader><CardTitle className="text-lg">About this listing</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                This solution was <span className="font-medium text-slate-800">verified by a platform admin</span>, not measured through
                a PilotSetu pilot. It has no impact score, ROI or trust badge yet — those appear once it completes a pilot.
              </p>
            </CardContent>
          </Card>

          {canRequest && <RequestSolutionForm solutionId={solution.id} />}

          {solution.requests.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader><CardTitle className="text-lg">Interest so far</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {solution.requests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
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
