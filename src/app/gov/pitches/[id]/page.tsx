import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOfficer } from "@/lib/officer";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TrlBadge from "@/components/TrlBadge";
import PitchActions from "./PitchActions";
import { psCode } from "@/lib/problemFields";
import { trlLabel } from "@/lib/trl";

export default async function PitchDetailPage({ params }: { params: { id: string } }) {
  const officer = await getOfficer();
  if (!officer) redirect("/login");

  const pitch = await prisma.pitch.findUnique({
    where: { id: params.id },
    include: {
      problem: { include: { department: true } },
      startup: true
    }
  });

  // Officers can only review pitches for their own department's problems.
  if (!pitch || pitch.problem.departmentId !== officer.departmentId) notFound();

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
      <div className="space-y-2">
        <Link href={`/gov/pitches?ps=${pitch.problemId}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1B3A6B]">
          <span className="rounded bg-[#1B3A6B] px-2 py-0.5 font-mono text-xs font-semibold text-white">{psCode(pitch.problem.psNumber)}</span>
          {pitch.problem.title}
        </Link>
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(pitch.status)} border-0`}>{pitch.status}</Badge>
          <h1 className="text-2xl font-bold">{pitch.startup.companyName}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Solution Summary</CardTitle>
              <CardDescription>Submitted by {pitch.startup.companyName}</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="whitespace-pre-line">{pitch.solutionSummary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Problem Context</CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold">
                <span className="mr-2 font-mono text-sm text-[#1B3A6B]">{psCode(pitch.problem.psNumber)}</span>
                {pitch.problem.title}
              </h4>
              <p className="text-sm text-slate-600 mt-1 line-clamp-4 whitespace-pre-line">{pitch.problem.description}</p>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                <span>{pitch.problem.department?.name} • {pitch.problem.department?.state}</span>
                <Link href={`/problems/${pitch.problemId}`} className="text-[#1B3A6B] hover:underline">Full problem statement →</Link>
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
                <span className="text-slate-500">Technology Readiness:</span>
                <div className="mt-1 space-y-1">
                  <TrlBadge level={pitch.techReadinessLevel} showStage />
                  <p className="text-xs text-slate-600">{trlLabel(pitch.techReadinessLevel)} (self-declared)</p>
                </div>
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
