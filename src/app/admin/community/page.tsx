import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";
import type { Prisma } from "@prisma/client";

const STATUSES = ["PENDING", "ADOPTED", "REJECTED"];
const SORTS = ["newest", "oldest"];
const FIELD = "h-9 w-full rounded-md border border-input bg-white px-2 text-sm shadow-sm";
const LABEL = "mb-1 block text-xs font-medium text-slate-600";

type Search = { q?: string; status?: string; sort?: string };

export default async function CommunityReportsPage({ searchParams }: { searchParams: Search }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  const allReports = await prisma.unregisteredProblem.findMany({ orderBy: { createdAt: "desc" } });

  const q = searchParams.q?.trim().toLowerCase() ?? "";
  const status = STATUSES.includes(searchParams.status ?? "") ? searchParams.status! : "";
  const sort = SORTS.includes(searchParams.sort ?? "") ? searchParams.sort! : "newest";

  const beforeStatus = allReports.filter(
    (r) => !q || [r.title, r.description, r.location, r.reporter].filter(Boolean).some((s) => (s as string).toLowerCase().includes(q))
  );
  const filtered = beforeStatus.filter((r) => !status || r.status === status);
  if (sort === "oldest") filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const filtersActive = !!(q || status);

  const getStatusColor = (s: string) => {
    switch (s) {
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
            <div className="text-2xl font-bold">{beforeStatus.filter((r) => r.status === "PENDING").length}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Pending Review</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{beforeStatus.filter((r) => r.status === "ADOPTED").length}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Adopted</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{beforeStatus.filter((r) => r.status === "REJECTED").length}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">Rejected</div>
          </CardContent>
        </Card>
      </div>

      <form method="get" className="grid grid-cols-1 gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-4">
        <div className="md:col-span-2">
          <label className={LABEL} htmlFor="q">Search</label>
          <Input id="q" name="q" defaultValue={searchParams.q ?? ""} placeholder="Title, description, location or reporter" className="bg-white" />
        </div>
        <div>
          <label className={LABEL} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status} className={FIELD}>
            <option value="">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" defaultValue={sort} className={FIELD}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className="flex items-end gap-2 md:col-span-4">
          <Button type="submit" size="sm" className="bg-[#1B3A6B] hover:bg-[#142A4F]">Apply filters</Button>
          {filtersActive && (
            <Link href="/admin/community">
              <Button type="button" size="sm" variant="ghost">Clear</Button>
            </Link>
          )}
        </div>
      </form>

      <Card className="border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    {allReports.length === 0 ? "No community reports yet." : "No reports match these filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <p className="font-medium">{report.title}</p>
                      <p className="text-sm text-slate-500 line-clamp-1">{report.description}</p>
                    </TableCell>
                    <TableCell>{report.location || "—"}</TableCell>
                    <TableCell>{report.reporter || "Anonymous"}</TableCell>
                    <TableCell><Badge className={`${getStatusColor(report.status)} border-0`}>{report.status}</Badge></TableCell>
                    <TableCell className="text-sm text-slate-500">{new Date(report.createdAt).toLocaleDateString("en-IN")}</TableCell>
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
                        {report.status === "ADOPTED" && <span className="text-sm text-green-600">Adopted</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
