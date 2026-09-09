import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function Shell({ children, user }: { children: React.ReactNode, user?: any }) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar user={user} />
      <div className="flex flex-1 overflow-hidden">
        {user && <Sidebar role={user.role} />}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
