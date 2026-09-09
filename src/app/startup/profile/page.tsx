import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

const prisma = new PrismaClient();

export default async function StartupProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'STARTUP') redirect('/login');

  const profile = await prisma.startupProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: { documents: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Startup Profile & Verification</h1>
        <p className="text-slate-500">Manage your company details and verification documents.</p>
      </div>

      <ProfileForm initialProfile={profile} />
    </div>
  );
}
