"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Search, Bell, LogOut, User } from "lucide-react";
import { SetuLogo } from "./SetuLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Navbar({ user }: { user: any }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error("Signout error:", e);
    }
    window.location.href = "/login";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/problems?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top subtle tricolor stripe */}
      <div className="h-1 w-full flex">
        <div className="h-full flex-1 bg-[#FF9933]" />
        <div className="h-full flex-1 bg-[#FFFFFF]" />
        <div className="h-full flex-1 bg-[#138808]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-[72px] gap-4">
        {/* Brand: Official PilotSetu Logo */}
        <Link href="/" className="flex items-center gap-3.5 group shrink-0">
          <SetuLogo className="h-11 md:h-12 w-auto transition-transform group-hover:scale-105 duration-200" priority />
          <div className="hidden lg:flex flex-col border-l border-slate-200 pl-3.5">
            <span className="text-[12px] font-bold text-[#1B3A6B] leading-tight">
              Gov-Startup Innovation Exchange
            </span>
            <span className="text-[10.5px] font-medium text-slate-400">
              Government of India • भारत सरकार
            </span>
          </div>
        </Link>

        {/* Center Search Bar (MyGov Style) */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-md mx-6 items-center relative"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search challenges, solutions, or departments..."
            className="w-full h-10 pl-4 pr-10 rounded-full border border-slate-200 bg-slate-50/80 hover:bg-white focus:bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1.5 w-7 h-7 rounded-full bg-[#1B3A6B] text-white flex items-center justify-center hover:bg-[#142a4e] transition-colors"
          >
            <Search size={14} />
          </button>
        </form>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <LanguageSwitcher />

          {/* Notification Quick Bell */}
          <Link
            href="/notifications"
            className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-600 flex items-center justify-center transition-colors"
            title="Notifications"
          >
            <Bell size={17} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {user.name || "Officer"}
                </span>
                <span className="text-[10px] font-bold text-[#c45b2b] uppercase tracking-wider">
                  {user.role?.replace("_", " ")}
                </span>
              </div>

              {/* User Avatar Circle */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 px-3 py-1.5 rounded-full transition-all"
                title="Sign out"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="btn-gov-cta px-5 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <User size={14} />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
