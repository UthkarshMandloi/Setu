import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewDepartment, getOfficer, OFFICER_ROLES } from "@/lib/officer";
import { EVIDENCE_DIR, EVIDENCE_TYPES, STORED_NAME_PATTERN } from "@/lib/evidence";

// Evidence is visible to the startup that submitted it and to officers who can view the pilot.
export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const name = params.name;
  if (!STORED_NAME_PATTERN.test(name)) return new NextResponse("Not found", { status: 404 });

  const result = await prisma.kPIResult.findFirst({
    where: { attachmentUrl: `/api/files/evidence/${name}` },
    include: { kpi: { include: { pilot: { select: { departmentId: true, pitch: { select: { startupId: true } } } } } } },
  });
  if (!result) return new NextResponse("Not found", { status: 404 });

  const role = (session.user as any).role as string;
  let allowed = role === "PLATFORM_ADMIN";
  if (role === "STARTUP") {
    const profile = await prisma.startupProfile.findUnique({ where: { userId: (session.user as any).id }, select: { id: true } });
    allowed = profile?.id === result.kpi.pilot.pitch.startupId;
  } else if (OFFICER_ROLES.includes(role)) {
    const officer = await getOfficer();
    allowed = !!officer && canViewDepartment(officer, result.kpi.pilot.departmentId);
  }
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  const file = await readFile(path.join(EVIDENCE_DIR, name)).catch(() => null);
  if (!file) return new NextResponse("Not found", { status: 404 });

  const ext = path.extname(name);
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": EVIDENCE_TYPES[ext] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="evidence${ext}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
