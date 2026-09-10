import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, User, FileText, CheckCircle, XCircle } from "lucide-react";



export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["GOV_ADMIN", "PLATFORM_ADMIN"].includes((session.user as any).role)) {
    redirect("/login");
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      actor: { select: { name: true, email: true, role: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const getActionIcon = (action: string) => {
    if (action.includes("SELECTED") || action.includes("ACCEPTED") || action.includes("ADOPTED")) {
      return <CheckCircle className="text-green-600" size={16} />;
    }
    if (action.includes("REJECTED")) {
      return <XCircle className="text-red-600" size={16} />;
    }
    if (action.includes("PITCH") || action.includes("PROBLEM")) {
      return <FileText className="text-blue-600" size={16} />;
    }
    return <Activity className="text-slate-600" size={16} />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("SELECTED") || action.includes("ACCEPTED") || action.includes("ADOPTED")) {
      return "bg-green-100 text-green-800";
    }
    if (action.includes("REJECTED")) {
      return "bg-red-100 text-red-800";
    }
    return "bg-slate-100 text-slate-800";
  };

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
            <div className="text-xs font-medium text-slate-500 mt-1">Total Actions</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              <div className="text-2xl font-bold">
                {logs.filter(l => l.action.includes("SELECTED") || l.action.includes("ACCEPTED")).length}
              </div>
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Approvals</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="text-red-600" size={20} />
              <div className="text-2xl font-bold">
                {logs.filter(l => l.action.includes("REJECTED")).length}
              </div>
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Rejections</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
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
                  No audit logs yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <Badge className={`${getActionColor(log.action)} border-0 text-xs`}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{log.actor?.name || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{log.actor?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{log.entityType}</p>
                      <p className="text-xs text-slate-400 font-mono">{log.entityId.substring(0, 8)}...</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                    {log.details || "—"}
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
