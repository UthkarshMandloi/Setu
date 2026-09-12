import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewSolutionForm from "./ReviewSolutionForm";
import { toLines } from "@/lib/problemFields";
import { SOLUTION_STATUS_META, type SolutionStatus } from "@/lib/solutionFields";

export default async function ReviewSolutionPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  const solution = await prisma.startupSolution.findUnique({
    where: { id: params.id },
    include: { startup: { include: { user: { select: { email: true } } } } },
  });
  if (!solution) notFound();

  const meta = SOLUTION_STATUS_META[solution.status as SolutionStatus] ?? { label: solution.status, tone: "bg-slate-100 text-slate-700" };
  const features = toLines(solution.keyFeatures);
  const proof = toLines(solution.deploymentProof);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge className={`${meta.tone} border-0`}>{meta.label}</Badge>
        <h1 className="text-2xl font-bold">{solution.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader><CardTitle>What it does</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-line text-sm text-slate-700">{solution.description}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Problem it solves</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-line text-sm text-slate-700">{solution.problemSolved}</p></CardContent>
          </Card>
          {features.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Key features</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
          {proof.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Existing deployments / proof</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {proof.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
          {solution.evidenceUrl && (
            <Card>
              <CardHeader><CardTitle>Evidence link</CardTitle></CardHeader>
              <CardContent>
                <a href={solution.evidenceUrl} target="_blank" rel="noreferrer" className="text-sm text-[#1B3A6B] hover:underline break-all">
                  {solution.evidenceUrl}
                </a>
              </CardContent>
            </Card>
          )}
          {solution.status !== "PENDING" && solution.reviewNotes && (
            <Card className="border-slate-200 bg-slate-50">
              <CardHeader><CardTitle className="text-base">Review notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-slate-700">{solution.reviewNotes}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50 border-slate-200 shadow-none">
            <CardHeader><CardTitle className="text-lg">Startup</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-slate-500">Company:</span><p className="font-medium">{solution.startup.companyName}</p></div>
              <div><span className="text-slate-500">Contact:</span><p className="font-medium">{solution.startup.user?.email}</p></div>
              <div><span className="text-slate-500">Sector:</span><p className="font-medium">{solution.sector || "N/A"}</p></div>
              <div><span className="text-slate-500">Verification status:</span><p className="font-medium">{solution.startup.verificationStatus}</p></div>
            </CardContent>
          </Card>

          {solution.status === "PENDING" && <ReviewSolutionForm solutionId={solution.id} />}
        </div>
      </div>
    </div>
  );
}
