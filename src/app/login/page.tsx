import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    const role = (session.user as any).role;
    if (role === 'STARTUP') redirect('/startup');
    if (role === 'GOV_OFFICER') redirect('/gov');
    if (role === 'GOV_ADMIN') redirect('/admin');
    if (role === 'PLATFORM_ADMIN') redirect('/admin');
    redirect('/report-problem');
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1B3A6B]">Sign in to Setu</h1>
        <p className="text-sm text-slate-500 mt-2">Government-Startup Innovation Exchange</p>
      </div>
      
      <LoginForm />
    </div>
  );
}
