import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNavCounts } from "@/lib/navCounts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;
    const counts = await getNavCounts(userId, role);
    return NextResponse.json(counts);
  } catch (error) {
    return NextResponse.json({}, { status: 500 });
  }
}
