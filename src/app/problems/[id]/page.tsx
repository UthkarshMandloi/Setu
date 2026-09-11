import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOfficer } from "@/lib/officer";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PitchForm from "./PitchForm";
import ProblemManageActions from "@/app/gov/problems/ProblemManageActions";
import { psCode, toLines, type KpiSuggestion } from "@/lib/problemFields";

const STATUS_NOTE: Record<string, { text: string; tone: string }> = {
  DRAFT: {
    text: "Draft — only officers of your department can see this. Publish it to start receiving pitches.",
    tone: "border-slate-300 bg-slate-50 text-slate-700",
  },
  PUBLISHED: {
    text: "Published — visible to all verified startups and open for pitches.",
    tone: "border-green-200 bg-green-50 text-green-800",
  },
  CLOSED: {
    text: "Closed — no longer accepting new pitches. Pitches already received remain available for review.",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
  },
};

export default async function ProblemDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const problem = await prisma.problem.findUnique({
    where: { id: params.id },
    include: {
      department: true,
      pitches: {
        include: { startup: true }
      }
    }
  });

  if (!problem) notFound();

  const officer = await getOfficer();
  const canManage = !!officer?.departmentId && officer.departmentId === problem.departmentId;
  // Drafts are private to the owning department.
  if (problem.status === "DRAFT" && !canManage) notFound();

  // Check if user's startup already pitched
  let existingPitch = null;
  if (session?.user && (session.user as any).role === 'STARTUP') {
    const profile = await prisma.startupProfile.findUnique({
      where: { userId: (session.user as any).id }
    });
    if (profile) {
      existingPitch = await prisma.pitch.findFirst({
        where: {
          problemId: problem.id,
          startupId: profile.id
        }
      });
    }
  }

  const isStartup = session?.user && (session.user as any).role === 'STARTUP';
  const scope = toLines(problem.scope);
  const outcomes = toLines(problem.expectedOutcomes);
  const constraints = toLines(problem.constraints);
  const kpis = (problem.suggestedKpis as unknown as KpiSuggestion[] | null) ?? [];
  const note = STATUS_NOTE[problem.status];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="rounded bg-[#1B3A6B] px-2 py-0.5 font-mono text-xs font-semibold text-white">
            {psCode(problem.psNumber)}
          </span>
          <Badge variant="outline">{problem.sourceType}</Badge>
          <Badge>{problem.status}</Badge>
          {problem.aiAssisted && (
            <Badge variant="outline" className="border-amber-300 text-amber-800">AI-assisted drafting</Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">{problem.title}</h1>
        <p className="text-slate-500 mt-1">{problem.department?.name} • {problem.department?.state}</p>
      </div>

      {canManage && note && (
        <div className={`flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between ${note.tone}`}>
          <p className="text-sm">{note.text}</p>
          <ProblemManageActions problemId={problem.id} status={problem.status} pitchCount={problem.pitches.length} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Problem Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{problem.description}</p>
            </CardContent>
          </Card>

          {scope.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scope &amp; Technical Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <BulletList items={scope} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Expected Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              {outcomes.length > 0 ? <BulletList items={outcomes} /> : <p className="text-sm text-slate-600">Not specified</p>}
            </CardContent>
          </Card>

          {kpis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Proposed Success KPIs</CardTitle>
                <CardDescription>Pilots are scored automatically against these targets.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-slate-500">
                        <th className="pb-2 font-medium">Metric</th>
                        <th className="pb-2 font-medium">Target</th>
                        <th className="pb-2 font-medium">Direction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.map((k, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="py-2 pr-4 font-medium text-slate-800">{k.metric}</td>
                          <td className="py-2 pr-4">{k.target} {k.unit}</td>
                          <td className="py-2 text-slate-600">{k.direction === "LOWER_IS_BETTER" ? "Lower is better" : "Higher is better"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {constraints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Constraints</CardTitle>
              </CardHeader>
              <CardContent>
                <BulletList items={constraints} />
              </CardContent>
            </Card>
          )}

          {isStartup && (problem.status === 'PUBLISHED' || existingPitch) && (
            <Card>
              <CardHeader>
                <CardTitle>{existingPitch ? 'Your Pitch' : 'Submit Your Solution'}</CardTitle>
                <CardDescription>
                  {existingPitch ? 'You have already submitted a pitch for this problem.' : 'Describe your solution and team.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PitchForm problemId={problem.id} existingPitch={existingPitch} />
              </CardContent>
            </Card>
          )}

          {isStartup && problem.status === 'CLOSED' && !existingPitch && (
            <p className="text-sm text-slate-500">This problem is closed to new pitches.</p>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50 border-slate-200 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500">Theme:</span>
                <p className="font-medium">{problem.theme || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Budget:</span>
                <p className="font-medium">{problem.budgetBand || 'TBD'}</p>
              </div>
              <div>
                <span className="text-slate-500">Pitch deadline:</span>
                <p className="font-medium">
                  {problem.deadline ? new Date(problem.deadline).toLocaleDateString('en-IN') : 'Open'}
                </p>
              </div>
              {problem.pilotDurationWeeks && (
                <div>
                  <span className="text-slate-500">Proposed pilot duration:</span>
                  <p className="font-medium">{problem.pilotDurationWeeks} weeks</p>
                </div>
              )}
              {problem.targetBeneficiaries && (
                <div>
                  <span className="text-slate-500">Target beneficiaries:</span>
                  <p className="font-medium">{problem.targetBeneficiaries}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pitches Received</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#1B3A6B]">{problem.pitches.length}</p>
              <p className="text-xs text-slate-500 mt-1">solutions submitted</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
