import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { SetuLogo } from "@/components/layout/SetuLogo";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const role = (session.user as any).role;
    if (role === "STARTUP") redirect("/startup");
    if (role === "GOV_OFFICER") redirect("/gov");
    if (role === "GOV_ADMIN") redirect("/admin");
    if (role === "PLATFORM_ADMIN") redirect("/admin/audit-log");
    redirect("/report-problem");
  }

  return (
    <div className="max-w-md mx-auto my-12 overflow-hidden rounded-3xl bg-white/95 border border-slate-200/80 shadow-gov-card backdrop-blur-md">
      {/* Top tricolor header accent */}
      <div className="h-1.5 w-full flex">
        <div className="h-full flex-1 bg-[#FF9933]" />
        <div className="h-full flex-1 bg-[#FFFFFF]" />
        <div className="h-full flex-1 bg-[#138808]" />
      </div>

      <div className="p-8">
        <div className="text-center mb-7">
          <div className="flex items-center justify-center mb-4">
            <SetuLogo className="h-16 w-auto" priority />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1B3A6B]">
            Sign in to SETU
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Government of India • Innovation Exchange Portal
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
