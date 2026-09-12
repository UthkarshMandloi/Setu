"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { NavIconTile, IconType } from "./NavIconTile";
import type { NavCounts } from "@/lib/navCounts";

interface NavItemConfig {
  name: string;
  path: string;
  icon: IconType;
  badge?: number;
}

export function Sidebar({
  role,
  initialCounts = {},
}: {
  role?: string;
  initialCounts?: NavCounts;
}) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<NavCounts>(initialCounts);

  // Keep counts in sync with live DB on client navigation
  useEffect(() => {
    let isMounted = true;
    fetch("/api/nav-counts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && isMounted) {
          setCounts(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Real database counts mapped directly to corresponding navigation items
  // Only display a badge if the actual database count is > 0. Otherwise, no badge is rendered.
  const linksByRole: Record<string, NavItemConfig[]> = {
    STARTUP: [
      { name: "Dashboard", path: "/startup/profile", icon: "poll" },
      {
        name: "Find Problems",
        path: "/problems",
        icon: "task",
        badge: counts.openProblems,
      },
      {
        name: "My Pitches",
        path: "/startup/pitches",
        icon: "discuss",
        badge: counts.myPitches,
      },
      {
        name: "Active Pilots",
        path: "/startup/pilots",
        icon: "pilot",
        badge: counts.activePilots,
      },
      {
        name: "My Solutions",
        path: "/startup/solutions",
        icon: "solution",
        badge: counts.mySolutions,
      },
      {
        name: "Marketplace",
        path: "/marketplace",
        icon: "marketplace",
        badge: counts.marketplace,
      },
      { name: "My Profile", path: "/startup/profile", icon: "profile" },
      {
        name: "Notifications",
        path: "/notifications",
        icon: "notification",
        badge: counts.notifications,
      },
    ],
    GOV_OFFICER: [
      {
        name: "My Problems",
        path: "/gov/problems",
        icon: "task",
        badge: counts.myProblems,
      },
      { name: "Post Problem", path: "/gov/problems/new", icon: "solution" },
      {
        name: "Review Pitches",
        path: "/gov/pitches",
        icon: "discuss",
        badge: counts.reviewPitches,
      },
      {
        name: "Active Pilots",
        path: "/gov/pilots",
        icon: "pilot",
        badge: counts.activePilots,
      },
      {
        name: "Marketplace",
        path: "/marketplace",
        icon: "marketplace",
        badge: counts.marketplace,
      },
      {
        name: "Notifications",
        path: "/notifications",
        icon: "notification",
        badge: counts.notifications,
      },
    ],
    GOV_ADMIN: [
      {
        name: "Startup Verification",
        path: "/admin/verify",
        icon: "verify",
        badge: counts.verifications,
      },
      {
        name: "Solution Submissions",
        path: "/admin/solutions",
        icon: "solution",
        badge: counts.solutionSubmissions,
      },
      {
        name: "Community Reports",
        path: "/admin/community",
        icon: "campaign",
        badge: counts.communityReports,
      },
      { name: "Audit Log", path: "/admin/audit-log", icon: "audit" },
      {
        name: "Notifications",
        path: "/notifications",
        icon: "notification",
        badge: counts.notifications,
      },
    ],
    PLATFORM_ADMIN: [
      { name: "Audit Log", path: "/admin/audit-log", icon: "audit" },
      {
        name: "Verification Desk",
        path: "/admin/verify",
        icon: "verify",
        badge: counts.verifications,
      },
      {
        name: "Marketplace Admin",
        path: "/marketplace",
        icon: "marketplace",
        badge: counts.marketplace,
      },
      {
        name: "Notifications",
        path: "/notifications",
        icon: "notification",
        badge: counts.notifications,
      },
    ],
    CITIZEN: [
      { name: "Report Problem", path: "/report-problem", icon: "campaign" },
      {
        name: "Public Challenges",
        path: "/problems",
        icon: "task",
        badge: counts.openProblems,
      },
      {
        name: "Notifications",
        path: "/notifications",
        icon: "notification",
        badge: counts.notifications,
      },
    ],
    GUEST: [
      {
        name: "Open Problems",
        path: "/problems",
        icon: "task",
        badge: counts.openProblems,
      },
      {
        name: "Solution Marketplace",
        path: "/marketplace",
        icon: "marketplace",
        badge: counts.marketplace,
      },
      { name: "Report Civic Issue", path: "/report-problem", icon: "campaign" },
      { name: "Sign In", path: "/login", icon: "profile" },
    ],
  };

  const navLinks = linksByRole[role || "GUEST"] || linksByRole.GUEST;

  return (
    <aside className="w-68 bg-white/90 backdrop-blur-md border-r border-slate-200/80 min-h-[calc(100vh-76px)] flex flex-col pt-6 pb-8 px-3 shrink-0 select-none">
      {/* Sidebar Category Header */}
      <div className="px-3 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {role ? `${role.replace("_", " ")} MENU` : "PORTAL SERVICES"}
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-1.5">
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link
              key={link.name + link.path}
              href={link.path}
              className={`group flex items-center gap-3.5 px-3 py-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-[#eef7fc] text-[#0369a1] font-semibold border border-sky-100 shadow-xs"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-50/80 hover:translate-x-1"
              }`}
            >
              <NavIconTile
                type={link.icon}
                badgeCount={link.badge}
                isActive={isActive}
              />
              <span className="text-[14.5px] tracking-tight leading-snug truncate">
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Official Helpdesk Box */}
      <div className="mt-auto pt-6 px-3 border-t border-slate-100">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-150/80 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Gov-Tech Helpdesk</p>
          <p className="text-[11px] mt-0.5 text-slate-400">Toll Free: 1800-11-PILOTSETU</p>
        </div>
      </div>
    </aside>
  );
}
