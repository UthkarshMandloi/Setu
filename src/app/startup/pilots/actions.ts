"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getStartupProfile } from "@/lib/startup";
import { OFFICER_ROLES } from "@/lib/officer";
import { saveEvidenceFile } from "@/lib/evidence";
import { withUnit } from "@/lib/format";

export async function submitKpiResult(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getStartupProfile();
  if (!profile) throw new Error("Unauthorized");

  // Startups may only report on KPIs of their own pilots, and only while the pilot is running.
  const kpiId = String(formData.get("kpiId") ?? "");
  const kpi = await prisma.kPI.findUnique({
    where: { id: kpiId },
    include: { pilot: { select: { id: true, status: true, departmentId: true, pitch: { select: { startupId: true } } } } },
  });
  if (!kpi || kpi.pilot.pitch.startupId !== profile.id) throw new Error("Unauthorized");
  if (kpi.pilot.status !== "IN_PROGRESS") {
    return { ok: false, error: "Results can only be submitted while the pilot is in progress." };
  }

  const actualRaw = String(formData.get("actual") ?? "").trim();
  const actual = Number(actualRaw);
  if (!actualRaw || !Number.isFinite(actual) || actual < 0) {
    return { ok: false, error: "Enter the measured value as a number (0 or more)." };
  }

  const evidence = String(formData.get("evidence") ?? "").trim();
  if (evidence.length < 15) {
    return { ok: false, error: "Describe how the value was measured (at least a sentence) so the department can verify it." };
  }

  let attachmentUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const saved = await saveEvidenceFile(file);
    if (!saved.ok) return saved;
    attachmentUrl = saved.url;
  }

  await prisma.kPIResult.create({
    data: { kpiId, actual, evidence: evidence.slice(0, 2000), attachmentUrl },
  });

  const officers = await prisma.user.findMany({
    where: { departmentId: kpi.pilot.departmentId, role: { in: OFFICER_ROLES } },
    select: { id: true },
  });
  const summary = `${profile.companyName} reported ${withUnit(actual, kpi.unit)} for "${kpi.metric}" (target ${withUnit(kpi.target, kpi.unit)}).`;

  await prisma.$transaction([
    prisma.auditLog.create({
      data: { action: "KPI_RESULT_SUBMITTED", entityType: "KPI", entityId: kpiId, actorId: profile.userId, details: summary },
    }),
    prisma.notification.createMany({
      data: officers.map((o) => ({
        userId: o.id,
        title: "New KPI result submitted",
        message: summary,
        type: "INFO",
        link: `/gov/pilots/${kpi.pilot.id}`,
      })),
    }),
  ]);

  revalidatePath(`/startup/pilots/${kpi.pilot.id}`);
  revalidatePath("/startup/pilots");
  revalidatePath(`/gov/pilots/${kpi.pilot.id}`);
  revalidatePath("/gov/pilots");
  return { ok: true };
}
