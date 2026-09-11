import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { psCode } from "@/lib/problemFields";

export default async function ProblemsPage() {
  const problems = await prisma.problem.findMany({
    where: { status: 'PUBLISHED' },
    include: { department: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Open Problems</h1>
          <p className="text-slate-500">Browse government challenges and submit your solution.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {problems.map((problem) => (
          <Card key={problem.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-center gap-2 mb-1">
                <span className="rounded bg-[#1B3A6B] px-2 py-0.5 font-mono text-xs font-semibold text-white">
                  {psCode(problem.psNumber)}
                </span>
                <Badge variant="outline">{problem.sourceType}</Badge>
              </div>
              <CardTitle className="text-lg">{problem.title}</CardTitle>
              <CardDescription className="line-clamp-2">{problem.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-slate-600 mb-4">
                <span>{problem.department?.name}</span>
                <span>{problem.department?.state}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  {problem.budgetBand || 'Budget TBD'}
                </span>
                <Link href={`/problems/${problem.id}`}>
                  <Button size="sm" variant="outline">View & Pitch</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
