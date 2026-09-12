import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOfficer } from "@/lib/officer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import ProblemManageActions from "./ProblemManageActions";
import { psCode } from "@/lib/problemFields";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  PUBLISHED: "bg-green-100 text-green-800",
  CLOSED: "bg-amber-100 text-amber-800",
};

export default async function GovProblemsPage() {
  const officer = await getOfficer();
  if (!officer) redirect("/login");

  const problems = officer.departmentId
    ? await prisma.problem.findMany({
        where: { departmentId: officer.departmentId },
        include: {
          _count: { select: { pitches: true } }
        },
        orderBy: { createdAt: "desc" }
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Problems</h1>
          <p className="text-slate-500">
            Manage problems posted by {officer.department?.name ?? "your department"}.
          </p>
        </div>
        <Link href="/gov/problems/new">
          <Button className="bg-[#1B3A6B] hover:bg-[#142A4F] text-white rounded-full px-5">
            <Plus size={16} className="mr-1.5" />
            Post New Problem
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-gov-card overflow-hidden">
        <div className="grid divide-y">
          {problems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No problems posted yet. Click "Post New Problem" to get started.
            </div>
          ) : (
            problems.map((problem) => (
              <div
                key={problem.id}
                className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between hover:bg-slate-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="rounded bg-[#1B3A6B] px-2 py-0.5 font-mono text-xs font-semibold text-white">
                      {psCode(problem.psNumber)}
                    </span>
                    <h3 className="font-semibold">{problem.title}</h3>
                    <Badge className={`${STATUS_BADGE[problem.status] ?? "bg-slate-100 text-slate-700"} border-0`}>
                      {problem.status}
                    </Badge>
                    {problem.aiAssisted && (
                      <Badge variant="outline" className="border-amber-300 text-amber-800">AI-assisted</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{problem.description}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {problem._count.pitches} pitches • {problem.budgetBand || "Budget TBD"}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2 md:justify-end">
                  <Link href={`/problems/${problem.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  <ProblemManageActions
                    problemId={problem.id}
                    status={problem.status}
                    pitchCount={problem._count.pitches}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
