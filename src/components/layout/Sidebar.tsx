import Link from 'next/link';

export function Sidebar({ role }: { role?: string }) {
  if (!role) return null;

  const links = {
    STARTUP: [
      { name: 'Dashboard', path: '/startup' },
      { name: 'My Profile', path: '/startup/profile' },
      { name: 'Find Problems', path: '/problems' },
      { name: 'My Pitches', path: '/startup/pitches' },
      { name: 'Active Pilots', path: '/startup/pilots' },
      { name: 'Notifications', path: '/notifications' },
    ],
    GOV_OFFICER: [
      { name: 'Dashboard', path: '/gov' },
      { name: 'Post Problem', path: '/gov/problems/new' },
      { name: 'My Problems', path: '/gov/problems' },
      { name: 'Review Pitches', path: '/gov/pitches' },
      { name: 'Active Pilots', path: '/gov/pilots' },
      { name: 'Marketplace', path: '/marketplace' },
      { name: 'Notifications', path: '/notifications' },
    ],
    GOV_ADMIN: [
      { name: 'Dashboard', path: '/admin' },
      { name: 'Startup Verification', path: '/admin/verify' },
      { name: 'Community Reports', path: '/admin/community' },
      { name: 'Audit Log', path: '/admin/audit-log' },
      { name: 'Notifications', path: '/notifications' },
    ],
    PLATFORM_ADMIN: [
      { name: 'Overview', path: '/admin' },
      { name: 'Audit Log', path: '/admin/audit-log' },
      { name: 'Notifications', path: '/notifications' },
    ],
    CITIZEN: [
      { name: 'Report Problem', path: '/report-problem' },
    ]
  };

  const navLinks = links[role as keyof typeof links] || [];

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 min-h-[calc(100vh-72px)] flex flex-col pt-6 px-4">
      <nav className="flex-1 flex flex-col gap-2">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.path}
            className="px-3 py-2 rounded-md hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors text-sm font-medium"
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
