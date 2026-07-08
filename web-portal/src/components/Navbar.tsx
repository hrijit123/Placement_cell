"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import NotificationsDropdown from "./NotificationsDropdown";
import { Heart, LayoutDashboard, Users, Handshake, FileBarChart, Settings } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const role = (session as any)?.user?.role;
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 border-b border-[#E1D8C9] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#2D4A22] fill-[#2D4A22]" />
            <Link href="/" className="font-serif font-bold text-[#2C241B] text-xl hover:opacity-80 transition-opacity">
              DEEDS Connect
            </Link>
          </div>

          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/" className={`flex items-center gap-1 text-sm font-medium ${pathname === '/' ? 'text-[#2D4A22] border-b-2 border-[#2D4A22] pb-1' : 'text-stone-500 hover:text-stone-800 transition-colors'}`}>
              <LayoutDashboard className="w-4 h-4" /> Home
            </Link>
            
            {role === "STUDENT" && (
              <Link href="/router?role=STUDENT" className="text-stone-500 hover:text-stone-800 px-3 py-2 text-sm font-medium">My Record</Link>
            )}

            {(role === "TEACHER" || role === "ADMIN") && (
              <>
                <Link href="/database" className={`flex items-center gap-1 text-sm font-medium ${pathname.includes('/database') ? 'text-[#2D4A22] border-b-2 border-[#2D4A22] pb-1' : 'text-stone-500 hover:text-stone-800 transition-colors'}`}>
                  <Users className="w-4 h-4" /> Students
                </Link>
                <Link href={role === "ADMIN" ? "/admin" : "/staff"} className={`flex items-center gap-1 text-sm font-medium ${pathname.includes('/admin') || pathname.includes('/staff') && !pathname.includes('syllabus') ? 'text-[#2D4A22] border-b-2 border-[#2D4A22] pb-1' : 'text-stone-500 hover:text-stone-800 transition-colors'}`}>
                  <Handshake className="w-4 h-4" /> Placements
                </Link>
                <Link href="/attendance" className={`flex items-center gap-1 text-sm font-medium ${pathname.includes('/attendance') ? 'text-[#2D4A22] border-b-2 border-[#2D4A22] pb-1' : 'text-stone-500 hover:text-stone-800 transition-colors'}`}>
                  <FileBarChart className="w-4 h-4" /> Reports
                </Link>
                <Link href="#" className="flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors" onClick={(e) => { e.preventDefault(); alert("Settings page coming soon!"); }}>
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <Link href="/staff" className="text-stone-500 hover:text-stone-800 px-3 py-2 text-sm font-medium bg-stone-50 rounded-full border border-stone-200">Staff Portal</Link>
              </>
            )}
          </div>

          <div className="flex items-center">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse"></div>
            ) : session ? (
              <div className="flex items-center gap-4">
                <NotificationsDropdown />
                <span className="text-sm font-medium text-stone-700 hidden sm:block">
                  {session.user?.name} ({(session as any)?.user?.role})
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
