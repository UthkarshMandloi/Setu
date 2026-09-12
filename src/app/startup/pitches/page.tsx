import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStartupProfile } from "@/lib/startup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TrlBadge from "@/components/TrlBadge";
import { psCode } from "@/lib/problemFields";

const STATUS: Record<string, { label: string; tone: string }> = {
  SUBMITTED: { label: "Under review", tone: "bg-slate-100 text-slate-800" },
  SHORTLISTED: { label: "Shortlisted", tone: "bg-blue-100 text-blue-800" },
  SELECTED: { label: "Selected — pilot created", tone: "bg-green-100 text-green-800" },
  REJECTED: { label: "Not selected", tone: "bg-red-100 text-red-800" },
};

export default async function StartupPitchesPage() {
  const profile = await getStartupProfile();
  if (!profile) redirect("/login");

  const pitches = await prisma.pitch.findMany({
    where: { startupId: profile.id },
    include: {
      problem: { select: { id: true, title: true, psNumber: true, department: { select: { name: true, state: true } } } },
      pilot: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">My Pitches</h1>
        <p className="text-slate-500">Solutions {profile.companyName} has pitched to government problem statements.</p>
      </div>

      {pitches.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-12 text-center text-slate-500">
            You haven&apos;t pitched yet.{" "}
            <Link href="/problems" className="font-medium text-[#1B3A6B] hover:underline">Browse open problems</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem statement</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>TRL</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pitches.map((pitch) => {
                  const status = STATUS[pitch.status] ?? { label: pitch.status, tone: "bg-slate-100 text-slate-800" };
                  return (
                    <TableRow key={pitch.id}>
                      <TableCell className="max-w-md">
                        <span className="font-mono text-xs font-semibold text-[#1B3A6B]">{psCode(pitch.problem.psNumber)}</span>
                        <p className="line-clamp-1 font-medium">{pitch.problem.title}</p>
                        <p className="line-clamp-1 text-xs text-slate-500">{pitch.solutionSummary}</p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {pitch.problem.department.name}
                        {pitch.problem.department.state ? `, ${pitch.problem.department.state}` : ""}
                      </TableCell>
                      <TableCell><TrlBadge level={pitch.techReadinessLevel} /></TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600">{pitch.createdAt.toLocaleDateString("en-IN")}</TableCell>
                      <TableCell><Badge className={`${status.tone} whitespace-nowrap border-0`}>{status.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        {pitch.pilot ? (
                          <Link href={`/startup/pilots/${pitch.pilot.id}`}>
                            <Button size="sm" className="whitespace-nowrap bg-[#1B3A6B] hover:bg-[#142A4F]">Pilot workspace</Button>
                          </Link>
                        ) : (
                          <Link href={`/problems/${pitch.problem.id}`}>
                            <Button size="sm" variant="outline">View problem</Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
