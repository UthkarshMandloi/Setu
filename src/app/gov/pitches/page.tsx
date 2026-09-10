import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";



export default async function PitchReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_OFFICER", "GOV_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  // Get pitches for problems in user's department
  const pitches = await prisma.pitch.findMany({
    where: {
      problem: {
        departmentId: (session.user as any).departmentId
      }
    },
    include: {
      problem: { select: { title: true, id: true } },
      startup: { select: { companyName: true, sector: true, verificationStatus: true, eligibilityScore: true } }
    },
    orderBy: { createdAt: "desc" }
  });

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Pitches</h1>
        <p className="text-slate-500">Evaluate solutions submitted by startups.</p>
      </div>

      <div className="bg-white border rounded-md shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Problem</TableHead>
              <TableHead>Startup</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Eligibility</TableHead>
              <TableHead>TRL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pitches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  No pitches submitted yet.
                </TableCell>
              </TableRow>
            ) : (
              pitches.map((pitch) => (
                <TableRow key={pitch.id}>
                  <TableCell className="font-medium">{pitch.problem.title}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{pitch.startup.companyName}</p>
                    </div>
                  </TableCell>
                  <TableCell>{pitch.startup.sector || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{pitch.startup.eligibilityScore}</span>
                      <Badge variant="outline" className="text-xs">
                        {pitch.startup.verificationStatus}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>TRL {pitch.techReadinessLevel}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(pitch.status)} border-0`}>
                      {pitch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/gov/pitches/${pitch.id}`}>
                      <Button size="sm" variant="outline">Review</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
