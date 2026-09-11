"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trlLabel, trlStage } from "@/lib/trl";

export default function TrlBadge({ level, showStage = false }: { level: number; showStage?: boolean }) {
  const { stage, tone } = trlStage(level);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex cursor-help items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}
          >
            TRL {level}
            {showStage && <span className="font-normal">· {stage}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs border-slate-900 bg-slate-900 text-xs text-white">
          <p className="font-semibold">Technology Readiness Level {level}/9 — {stage}</p>
          <p className="text-slate-200">{trlLabel(level)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
