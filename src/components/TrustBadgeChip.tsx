import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { TRUST_BADGE_META, type TrustBadge } from "@/lib/scoring/kpi";

const ICONS = { GREEN: ShieldCheck, YELLOW: ShieldAlert, RED: ShieldX };

export default function TrustBadgeChip({ badge, size = "sm" }: { badge: TrustBadge; size?: "sm" | "md" }) {
  const Icon = ICONS[badge];
  const meta = TRUST_BADGE_META[badge];
  const sizing = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-semibold ${sizing} ${meta.tone}`}>
      <Icon className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
      {meta.label} badge
    </span>
  );
}
