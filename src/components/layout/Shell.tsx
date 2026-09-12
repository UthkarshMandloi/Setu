import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import type { NavCounts } from "@/lib/navCounts";

export function Shell({
  children,
  user,
  counts,
}: {
  children: React.ReactNode;
  user?: any;
  counts?: NavCounts;
}) {
  return (
    <div className="min-h-screen gov-canvas flex flex-col font-sans text-slate-800 antialiased">
      <Navbar user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user?.role} initialCounts={counts} />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="max-w-6xl mx-auto transition-all">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
