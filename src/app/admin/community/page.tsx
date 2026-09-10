import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Eye, CheckCircle, XCircle } from "lucide-react";



export default async function CommunityReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  const reports = await prisma.unregisteredProblem.findMany({
    orderBy: { createdAt: "desc" }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ADOPTED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Community Reports</h1>
        <p className="text-slate-500 mt-1">Review problems reported by citizens. Adopt valid ones into the official registry.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{reports.filter(r => r.status === "PENDING").length}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Pending Review</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === "ADOPTED").length}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Adopted</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{reports.filter(r => r.status === "REJECTED").length}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Rejected</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Problem</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No community reports yet.
                </TableCell>
              </TableRow>
            ) : (
              reports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <p className="text-sm text-slate-500 line-clamp-1">{report.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{report.location || "—"}</TableCell>
                  <TableCell>{report.reporter || "Anonymous"}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(report.status)} border-0`}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {report.status === "PENDING" && (
                        <>
                          <Link href={`/admin/community/${report.id}/adopt`}>
                            <Button size="sm" variant="outline" className="gap-1 text-green-600 hover:text-green-700">
                              <CheckCircle size={14} /> Adopt
                            </Button>
                          </Link>
                          <form action={`/admin/community/${report.id}/reject`} method="POST">
                            <Button size="sm" variant="outline" className="gap-1 text-red-600 hover:text-red-700">
                              <XCircle size={14} /> Reject
                            </Button>
                          </form>
                        </>
                      )}
                      {report.status === "ADOPTED" && (
                        <span className="text-sm text-green-600">Adopted</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
