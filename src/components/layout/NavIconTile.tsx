import React from "react";

export type IconType =
  | "task"
  | "discuss"
  | "poll"
  | "blog"
  | "talk"
  | "quiz"
  | "prime"
  | "campaign"
  | "pilot"
  | "solution"
  | "verify"
  | "profile"
  | "notification"
  | "audit"
  | "marketplace";

interface NavIconTileProps {
  type: IconType;
  badgeCount?: number;
  isActive?: boolean;
}

export function NavIconTile({ type, badgeCount, isActive = false }: NavIconTileProps) {
  return (
    <div className="relative shrink-0 flex items-center justify-center">
      {/* Floating Counter Badge (MyGov Style) */}
      {typeof badgeCount === "number" && badgeCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1 z-10 px-1.5 py-0.2 min-w-[1.25rem] h-4.5 rounded-full bg-[#fed7aa] text-[#9a4b08] text-[10.5px] font-bold flex items-center justify-center shadow-xs ring-2 ring-white tracking-tight"
          aria-label={`${badgeCount} items`}
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}

      {/* Squircle Tile Container */}
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 border ${
          isActive
            ? "bg-white border-sky-200 shadow-md shadow-sky-100/50 scale-105"
            : "bg-white border-slate-150 shadow-gov-tile group-hover:shadow-gov-tile-hover group-hover:-translate-y-0.5 group-hover:border-slate-200"
        }`}
      >
        {renderIcon(type)}
      </div>
    </div>
  );
}

function renderIcon(type: IconType) {
  switch (type) {
    case "task":
      // Do/Task - Crisp Blue Clipboard with Pen
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <rect x="6" y="7" width="20" height="22" rx="4" fill="#3B82F6" />
          <path d="M11 5 C11 3.9 11.9 3 13 3 L19 3 C20.1 3 21 3.9 21 5 L21 7 L11 7 Z" fill="#1D4ED8" />
          <rect x="9" y="11" width="14" height="14" rx="2" fill="#EFF6FF" />
          <line x1="12" y1="15" x2="20" y2="15" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="12" y1="18.5" x2="17" y2="18.5" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" />
          {/* Pen / Pencil overlay */}
          <path d="M21 18 L24 15 L26 17 L23 20 Z" fill="#F59E0B" />
          <path d="M20 21 L22 20 L21 18 Z" fill="#D97706" />
        </svg>
      );

    case "discuss":
      // Discuss - Green & Amber Chat Bubbles
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <rect x="5" y="6" width="18" height="14" rx="4" fill="#10B981" />
          <polygon points="9,20 9,24 14,20" fill="#10B981" />
          <rect x="9" y="10" width="10" height="2" rx="1" fill="#FFFFFF" opacity="0.9" />
          <rect x="9" y="14" width="6" height="2" rx="1" fill="#FFFFFF" opacity="0.7" />
          {/* Second overlapping bubble */}
          <rect x="13" y="12" width="15" height="12" rx="3.5" fill="#FBBF24" />
          <polygon points="23,24 23,27 20,24" fill="#FBBF24" />
          <circle cx="17" cy="18" r="1.2" fill="#78350F" />
          <circle cx="21" cy="18" r="1.2" fill="#78350F" />
          <circle cx="25" cy="18" r="1.2" fill="#78350F" />
        </svg>
      );

    case "poll":
      // Poll / Survey - Colorful Bar Chart Pillars
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <rect x="6" y="16" width="4" height="10" rx="2" fill="#F43F5E" />
          <circle cx="8" cy="13" r="2" fill="#FB7185" />
          <rect x="14" y="10" width="4" height="16" rx="2" fill="#06B6D4" />
          <circle cx="16" cy="7" r="2" fill="#22D3EE" />
          <rect x="22" y="13" width="4" height="13" rx="2" fill="#F59E0B" />
          <circle cx="24" cy="10" r="2" fill="#FCD34D" />
          <line x1="4" y1="28" x2="28" y2="28" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "blog":
      // Blog / Articles - Dual tone Card/Notebook
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <rect x="5" y="6" width="22" height="20" rx="3.5" fill="#1E3A8A" />
          <rect x="5" y="6" width="22" height="6" rx="3.5" fill="#3B82F6" />
          <circle cx="9" cy="9" r="1.2" fill="#EF4444" />
          <circle cx="13" cy="9" r="1.2" fill="#F59E0B" />
          <circle cx="17" cy="9" r="1.2" fill="#10B981" />
          <rect x="8" y="15" width="8" height="8" rx="1.5" fill="#EC4899" opacity="0.85" />
          <line x1="19" y1="16" x2="24" y2="16" stroke="#93C5FD" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="19" y1="19.5" x2="24" y2="19.5" stroke="#93C5FD" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="19" y1="23" x2="22" y2="23" stroke="#93C5FD" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );

    case "talk":
      // Talk / Podcast / Townhall - Mic with Pink Gradient
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <rect x="12" y="5" width="8" height="13" rx="4" fill="#EC4899" />
          <path d="M8 12 C8 17.5 12 21 16 21 C20 21 24 17.5 24 12" stroke="#831843" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="21" x2="16" y2="26" stroke="#831843" strokeWidth="2" strokeLinecap="round" />
          <line x1="11" y1="26" x2="21" y2="26" stroke="#831843" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case "quiz":
      // Quiz / Challenges - Gold Trophy
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <path d="M9 7 L23 7 L21 17 C21 19.8 18.8 22 16 22 C13.2 22 11 19.8 11 17 Z" fill="#F59E0B" />
          <path d="M9 9 C6.5 9 6 13 8.5 14.5 C9.5 15 10 15 10.5 15" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M23 9 C25.5 9 26 13 23.5 14.5 C22.5 15 22 15 21.5 15" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="14" y="22" width="4" height="4" fill="#D97706" />
          <rect x="11" y="26" width="10" height="3" rx="1.5" fill="#334155" />
          <text x="16" y="15" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="bold">?</text>
        </svg>
      );

    case "prime":
      // MG Prime / Innovations - 3 connected gradient spheres
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <line x1="16" y1="9" x2="10" y2="20" stroke="#CBD5E1" strokeWidth="2" />
          <line x1="16" y1="9" x2="22" y2="20" stroke="#CBD5E1" strokeWidth="2" />
          <line x1="10" y1="20" x2="22" y2="20" stroke="#CBD5E1" strokeWidth="2" />
          <circle cx="16" cy="9" r="4.5" fill="#3B82F6" />
          <circle cx="10" cy="20" r="4.5" fill="#10B981" />
          <circle cx="22" cy="20" r="4.5" fill="#F59E0B" />
          <circle cx="16" cy="15" r="2" fill="#8B5CF6" />
        </svg>
      );

    case "campaign":
      // Campaigns / Citizen Reports - Vibrant Megaphone
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <path d="M7 13 L11 13 L17 9 L17 23 L11 19 L7 19 Z" fill="#EC4899" />
          <rect x="6" y="13" width="3" height="6" rx="1" fill="#BE185D" />
          <path d="M11 19 L13 25 L15 25 L13 19 Z" fill="#9D174D" />
          {/* Soundwaves */}
          <path d="M21 11 C23 13 24 15 24 16 C24 17 23 19 21 21" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M24 8 C27 11 28 14 28 16 C28 18 27 21 24 24" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );

    case "pilot":
      // Active Pilots - Rocket Launch
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <path d="M16 4 C16 4 23 9 23 18 L19 20 L16 18 L13 20 L9 18 C9 9 16 4 16 4 Z" fill="#4F46E5" />
          <circle cx="16" cy="12" r="2.5" fill="#E0E7FF" />
          <path d="M9 17 L6 21 L10 21 Z" fill="#818CF8" />
          <path d="M23 17 L26 21 L22 21 Z" fill="#818CF8" />
          {/* Rocket flame */}
          <path d="M14 20 L16 27 L18 20 Z" fill="#F59E0B" />
          <path d="M15 20 L16 24 L17 20 Z" fill="#EF4444" />
        </svg>
      );

    case "solution":
      // Solutions - Glowing Lightbulb / Spark
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <path d="M16 6 C11.5 6 8 9.5 8 14 C8 17.5 10 20 12 21.5 L12 24 C12 24.5 12.5 25 13 25 L19 25 C19.5 25 20 24.5 20 24 L20 21.5 C22 20 24 17.5 24 14 C24 9.5 20.5 6 16 6 Z" fill="#F59E0B" />
          <rect x="13" y="26" width="6" height="2" rx="1" fill="#64748B" />
          <path d="M14 13 L17 13 L15 17 L18 17" stroke="#FEF3C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "verify":
      // Verification / Admin - Shield with Checkmark
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <path d="M16 4 L25 8 L25 16 C25 22.5 16 28 16 28 C16 28 7 22.5 7 16 L7 8 Z" fill="#10B981" />
          <path d="M12 16 L15 19 L21 13" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "marketplace":
      // Marketplace - Storefront Bag / Exchange
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <rect x="7" y="11" width="18" height="16" rx="3" fill="#0EA5E9" />
          <path d="M11 11 C11 7.5 13 5 16 5 C19 5 21 7.5 21 11" stroke="#0369A1" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="16" cy="18" r="3" fill="#BAE6FD" />
          <path d="M16 16 L16 20 M14 18 L18 18" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case "profile":
      // User Profile - Friendly Avatar
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <circle cx="16" cy="11" r="5" fill="#6366F1" />
          <path d="M7 26 C7 21 11 18 16 18 C21 18 25 21 25 26" fill="#818CF8" />
        </svg>
      );

    case "notification":
      // Notifications - Amber Bell with Ping
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <path d="M16 6 C13 6 10 8.5 10 13 L10 18 L7 21 L25 21 L22 18 L22 13 C22 8.5 19 6 16 6 Z" fill="#F59E0B" />
          <circle cx="16" cy="24" r="2" fill="#D97706" />
          <circle cx="22" cy="7" r="2" fill="#EF4444" />
        </svg>
      );

    case "audit":
      // Audit Log - Clipboard History
      return (
        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
          <rect x="6" y="5" width="20" height="23" rx="3" fill="#475569" />
          <circle cx="16" cy="10" r="2" fill="#94A3B8" />
          <line x1="10" y1="16" x2="22" y2="16" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="10" y1="20" x2="19" y2="20" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="10" y1="24" x2="16" y2="24" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
}
