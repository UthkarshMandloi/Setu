import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PitchForm from "./PitchForm";

const prisma = new PrismaClient();

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

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{problem.sourceType}</Badge>
          <Badge>{problem.status}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{problem.title}</h1>
        <p className="text-slate-500 mt-1">{problem.department?.name} • {problem.department?.state}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Problem Description</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>{problem.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expected Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{problem.expectedOutcomes || 'Not specified'}</p>
            </CardContent>
          </Card>

          {session?.user && (session.user as any).role === 'STARTUP' && (
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
                <span className="text-slate-500">Deadline:</span>
                <p className="font-medium">
                  {problem.deadline ? new Date(problem.deadline).toLocaleDateString() : 'Open'}
                </p>
              </div>
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
