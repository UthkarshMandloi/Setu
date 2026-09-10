import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";



export default async function GovProblemsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  const problems = await prisma.problem.findMany({
    where: {
      departmentId: (session.user as any).departmentId
    },
    include: {
      _count: { select: { pitches: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Problems</h1>
          <p className="text-slate-500">Manage problems posted by your department.</p>
        </div>
        <Link href="/gov/problems/new">
          <Button className="bg-[#1B3A6B]">
            <Plus size={16} className="mr-2" />
            Post New Problem
          </Button>
        </Link>
      </div>

      <div className="bg-white border rounded-md shadow-sm">
        <div className="grid divide-y">
          {problems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No problems posted yet. Click "Post New Problem" to get started.
            </div>
          ) : (
            problems.map((problem) => (
              <div key={problem.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{problem.title}</h3>
                    <Badge variant={problem.status === "PUBLISHED" ? "default" : "secondary"}>
                      {problem.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{problem.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{problem._count.pitches} pitches</p>
                    <p className="text-xs text-slate-500">
                      {problem.budgetBand || "Budget TBD"}
                    </p>
                  </div>
                  <Link href={`/gov/problems/${problem.id}`}>
                    <Button variant="outline" size="sm">Manage</Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
