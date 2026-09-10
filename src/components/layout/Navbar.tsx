"use client";

import Link from 'next/link';
import { signOut } from 'next-auth/react';

export function Navbar({ user }: { user: any }) {
  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error("Signout error:", e);
    }
    window.location.href = "/login";
  };

  return (
    <header className="bg-[#1B3A6B] text-white py-4 px-6 shadow-md flex justify-between items-center z-10 sticky top-0">
      <div className="flex items-center gap-4">
        {/* Placeholder Emblem */}
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-white shadow-inner">
          S
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wide">SETU</h1>
          <p className="text-xs text-slate-300">Gov-Startup Innovation Exchange</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="text-sm text-right mr-4">
              <p className="font-semibold">{user.name}</p>
              <p className="text-xs text-[#D97706]">{user.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition cursor-pointer"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link href="/login" className="text-sm bg-[#D97706] hover:bg-[#b56305] px-4 py-2 rounded font-medium text-white transition">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
