// Technology Readiness Level — the standard 1–9 maturity scale (NASA / EU / DST).

export const TRL_LEVELS = [
  { level: 1, label: "Basic principles observed" },
  { level: 2, label: "Technology concept formulated" },
  { level: 3, label: "Experimental proof of concept" },
  { level: 4, label: "Technology validated in the lab" },
  { level: 5, label: "Technology validated in a relevant environment" },
  { level: 6, label: "Technology demonstrated in a relevant environment" },
  { level: 7, label: "Prototype demonstrated in an operational environment" },
  { level: 8, label: "System complete and qualified" },
  { level: 9, label: "System proven in actual operational use" },
] as const;

export const TRL_STAGES = [
  { stage: "Research", range: "TRL 1–3", tone: "bg-slate-100 text-slate-700", hint: "Idea or lab concept — highest pilot risk" },
  { stage: "Prototype", range: "TRL 4–6", tone: "bg-blue-100 text-blue-800", hint: "Working prototype tested in lab or simulated conditions" },
  { stage: "Deployment-ready", range: "TRL 7–9", tone: "bg-green-100 text-green-800", hint: "Proven in real operating conditions — lowest pilot risk" },
] as const;

export function trlStage(level: number) {
  return TRL_STAGES[level >= 7 ? 2 : level >= 4 ? 1 : 0];
}

export function trlLabel(level: number): string {
  return TRL_LEVELS.find((t) => t.level === level)?.label ?? "Not specified";
}
