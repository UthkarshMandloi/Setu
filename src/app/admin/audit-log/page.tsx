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
import { Activity, CheckCircle, FileText, XCircle } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { humanise } from "@/lib/format";

const FIELD = "h-9 w-full rounded-md border border-input bg-white px-2 text-sm shadow-sm";
const LABEL = "mb-1 block text-xs font-medium text-slate-600";

type Search = { q?: string; action?: string; entityType?: string; from?: string; to?: string };

const getActionIcon = (action: string) => {
  if (action.includes("SELECTED") || action.includes("ACCEPTED") || action.includes("ADOPTED") || action.includes("VERIFIED") || action.includes("APPROVE")) {
    return <CheckCircle className="text-green-600" size={16} />;
  }
  if (action.includes("REJECTED") || action.includes("DECLINED")) {
    return <XCircle className="text-red-600" size={16} />;
  }
  if (action.includes("PITCH") || action.includes("PROBLEM")) {
    return <FileText className="text-blue-600" size={16} />;
  }
  return <Activity className="text-slate-600" size={16} />;
};

const getActionColor = (action: string) => {
  if (action.includes("SELECTED") || action.includes("ACCEPTED") || action.includes("ADOPTED") || action.includes("VERIFIED") || action.includes("APPROVE")) {
    return "bg-green-100 text-green-800";
  }
  if (action.includes("REJECTED") || action.includes("DECLINED")) {
    return "bg-red-100 text-red-800";
  }
  return "bg-slate-100 text-slate-800";
};

export default async function AuditLogPage({ searchParams }: { searchParams: Search }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  const q = searchParams.q?.trim() ?? "";
  const action = searchParams.action ?? "";
  const entityType = searchParams.entityType ?? "";
  const from = searchParams.from ? new Date(searchParams.from) : null;
  const to = searchParams.to ? new Date(`${searchParams.to}T23:59:59.999`) : null;

  const [actions, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    prisma.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } }),
  ]);

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(q
      ? {
          OR: [
            { details: { contains: q, mode: "insensitive" } },
            { entityId: { contains: q, mode: "insensitive" } },
            { actor: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } },
          ],
        }
      : {}),
  };

  const logs = await prisma.auditLog.findMany({
    where,
    include: { actor: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const filtersActive = !!(q || action || entityType || from || to);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B3A6B]">Audit Log</h1>
        <p className="text-slate-500 mt-1">Complete history of all platform actions and decisions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="text-[#D97706]" size={20} />
              <div className="text-2xl font-bold">{logs.length}</div>
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">{filtersActive ? "Matching Actions" : "Total Actions"} (last 200)</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              <div className="text-2xl font-bold">
                {logs.filter((l) => l.action.includes("SELECTED") || l.action.includes("ACCEPTED") || l.action.includes("VERIFIED")).length}
              </div>
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Approvals</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="text-red-600" size={20} />
              <div className="text-2xl font-bold">{logs.filter((l) => l.action.includes("REJECTED") || l.action.includes("DECLINED")).length}</div>
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Rejections</div>
          </CardContent>
        </Card>
      </div>

      <form method="get" className="grid grid-cols-1 gap-3 rounded-md border bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-6">
        <div className="md:col-span-2">
          <label className={LABEL} htmlFor="q">Search</label>
          <Input id="q" name="q" defaultValue={q} placeholder="Actor, details or entity ID" className="bg-white" />
        </div>
        <div>
          <label className={LABEL} htmlFor="action">Action</label>
          <select id="action" name="action" defaultValue={action} className={FIELD}>
            <option value="">Any action</option>
            {actions.map((a) => (
              <option key={a.action} value={a.action}>{humanise(a.action)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="entityType">Entity type</label>
          <select id="entityType" name="entityType" defaultValue={entityType} className={FIELD}>
            <option value="">Any type</option>
            {entityTypes.map((e) => (
              <option key={e.entityType} value={e.entityType}>{e.entityType}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="from">From</label>
          <Input id="from" name="from" type="date" defaultValue={searchParams.from ?? ""} className="bg-white" />
        </div>
        <div>
          <label className={LABEL} htmlFor="to">To</label>
          <Input id="to" name="to" type="date" defaultValue={searchParams.to ?? ""} className="bg-white" />
        </div>
        <div className="flex items-end gap-2 md:col-span-2">
          <Button type="submit" size="sm" className="bg-[#1B3A6B] hover:bg-[#142A4F]">Apply filters</Button>
          {filtersActive && (
            <Link href="/admin/audit-log">
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
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    {filtersActive ? "No actions match these filters." : "No audit logs yet."}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-slate-500">{new Date(log.createdAt).toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge className={`${getActionColor(log.action)} border-0 text-xs`}>{log.action.replace(/_/g, " ")}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{log.actor?.name || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{log.actor?.email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{log.entityType}</p>
                      <p className="font-mono text-xs text-slate-400">{log.entityId.substring(0, 8)}...</p>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-slate-600">{log.details || "—"}</TableCell>
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
