import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { KPI_STATUS_META, type KpiStatus } from "@/lib/scoring/kpi";

const ICONS = { MET: CheckCircle2, PARTIAL: AlertCircle, NOT_MET: XCircle, PENDING: Clock };

export default function KpiStatusBadge({ status }: { status: KpiStatus }) {
  const Icon = ICONS[status];
  const meta = KPI_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${meta.tone}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}
