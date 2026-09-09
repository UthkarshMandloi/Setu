import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import ReviewForm from "./ReviewForm";

const prisma = new PrismaClient();

export default async function StartupReviewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['GOV_ADMIN', 'PLATFORM_ADMIN'].includes((session.user as any).role)) {
    redirect('/login');
  }

  const profile = await prisma.startupProfile.findUnique({
    where: { id: params.id },
    include: {
      documents: true,
      user: true
    }
  });

  if (!profile) return <div>Startup not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review: {profile.companyName}</h1>
        <p className="text-slate-500">Manual review of AI-flagged documents and eligibility.</p>
      </div>

      <ReviewForm profile={profile} />
    </div>
  );
}
