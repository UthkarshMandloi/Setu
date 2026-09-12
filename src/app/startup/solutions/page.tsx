import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStartupProfile } from "@/lib/startup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import SolutionActions from "./SolutionActions";
import SolutionRequestActions from "./SolutionRequestActions";
import { SOLUTION_STATUS_META, type SolutionDraft, type SolutionStatus } from "@/lib/solutionFields";

export default async function MySolutionsPage() {
  const profile = await getStartupProfile();
  if (!profile) redirect("/login");

  const solutions = await prisma.startupSolution.findMany({
    where: { startupId: profile.id },
    include: { requests: { include: { department: { select: { name: true, state: true } } }, orderBy: { createdAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">My Solutions</h1>
          <p className="text-slate-500">
            Solutions {profile.companyName} has already built, independent of any posted problem. Once verified by an
            admin, they appear on the marketplace for departments to discover directly.
          </p>
        </div>
        <Link href="/startup/solutions/new">
          <Button className="bg-[#1B3A6B] hover:bg-[#142A4F]">
            <Plus size={16} className="mr-2" /> List a Solution
          </Button>
        </Link>
      </div>

      {solutions.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-12 text-center text-slate-500">
            You haven&apos;t listed any solutions yet. Click &quot;List a Solution&quot; to showcase something you&apos;ve already built.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {solutions.map((s) => {
            const meta = SOLUTION_STATUS_META[s.status as SolutionStatus] ?? { label: s.status, tone: "bg-slate-100 text-slate-700" };
            const draft: SolutionDraft = {
              title: s.title,
              sector: s.sector ?? "",
              description: s.description,
              problemSolved: s.problemSolved,
              keyFeatures: s.keyFeatures ?? "",
              deploymentProof: s.deploymentProof ?? "",
              evidenceUrl: s.evidenceUrl ?? "",
            };
            const pendingRequests = s.requests.filter((r) => r.status === "PENDING");
            const decidedRequests = s.requests.filter((r) => r.status !== "PENDING");
            return (
              <Card key={s.id} className="border-slate-200 shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{s.title}</h3>
                        <Badge className={`${meta.tone} border-0`}>{meta.label}</Badge>
                        {s.status === "VERIFIED" && (
                          <Badge variant="outline" className="text-xs">{s.isListed ? "Listed" : "Unlisted"}</Badge>
                        )}
                        {s.sector && <Badge variant="outline" className="text-xs">{s.sector}</Badge>}
                      </div>
                      <p className="line-clamp-2 text-sm text-slate-500">{s.description}</p>
                    </div>
                    <SolutionActions id={s.id} status={s.status} isListed={s.isListed} draft={draft} />
                  </div>

                  {s.status === "REJECTED" && s.reviewNotes && (
                    <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                      <span className="font-medium">Admin feedback: </span>{s.reviewNotes}
                    </p>
                  )}

                  {pendingRequests.length > 0 && (
                    <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                        {pendingRequests.length} pilot request{pendingRequests.length === 1 ? "" : "s"} awaiting your response
                      </p>
                      {pendingRequests.map((r) => (
                        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white p-2">
                          <div>
                            <p className="text-sm font-medium">{r.department.name}{r.department.state ? `, ${r.department.state}` : ""}</p>
                            <p className="text-xs text-slate-500">{r.notes || "No notes"}</p>
                          </div>
                          <SolutionRequestActions requestId={r.id} />
                        </div>
                      ))}
                    </div>
                  )}

                  {decidedRequests.length > 0 && (
                    <div className="space-y-1">
                      {decidedRequests.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-xs text-slate-500">
                          <span>{r.department.name}</span>
                          <Badge variant={r.status === "ACCEPTED" ? "default" : "destructive"} className="text-[10px]">{r.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
