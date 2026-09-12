import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** The signed-in startup's profile, or null if the user isn't a startup (or has no profile yet). */
export async function getStartupProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "STARTUP") return null;
  return prisma.startupProfile.findUnique({ where: { userId: (session.user as any).id } });
}
