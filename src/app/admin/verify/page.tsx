import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function AdminVerifyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['GOV_ADMIN', 'PLATFORM_ADMIN'].includes((session.user as any).role)) {
    redirect('/login');
  }

  // Fetch startups that need review or are pending
  const startups = await prisma.startupProfile.findMany({
    where: {
      verificationStatus: { in: ['NEEDS_REVIEW', 'PENDING', 'REJECTED'] }
    },
    include: {
      documents: true,
      user: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verification Queue</h1>
        <p className="text-slate-500">Review startup profiles and AI-flagged documents.</p>
      </div>

      <div className="bg-white border rounded-md shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Startup</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Docs Submitted</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {startups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No startups pending review.
                </TableCell>
              </TableRow>
            ) : (
              startups.map((startup) => (
                <TableRow key={startup.id}>
                  <TableCell>
                    <div className="font-medium">{startup.companyName}</div>
                    <div className="text-xs text-slate-500">{startup.user?.email}</div>
                  </TableCell>
                  <TableCell>{startup.sector || 'N/A'}</TableCell>
                  <TableCell>{startup.documents.length} files</TableCell>
                  <TableCell>
                    <span className="font-semibold">{startup.eligibilityScore}</span>/100
                  </TableCell>
                  <TableCell>
                    <Badge variant={startup.verificationStatus === 'NEEDS_REVIEW' ? 'secondary' : 'outline'}
                           className={startup.verificationStatus === 'REJECTED' ? 'bg-red-50 text-red-700' : ''}>
                      {startup.verificationStatus.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/verify/${startup.id}`}>
                      <Button variant="outline" size="sm">Review Details</Button>
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
