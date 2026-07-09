"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import NotificationsDropdown from "./NotificationsDropdown";
import { Heart, LayoutDashboard, Users, Handshake, FileBarChart } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function Navbar() {
  const { data: session, status, update } = useSession();
  const role = (session as any)?.user?.role;
  const pathname = usePathname();

  useEffect(() => {
    if (status === "authenticated") {
      update();
    }
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 border-b border-[#E1D8C9] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-lg" aria-hidden="true">🌱</span>
              <span className="flex flex-col leading-tight">
                <span className="text-xl font-serif text-stone-900 font-bold group-hover:text-emerald-700 transition-colors">
                  Deeds Connect
                </span>
                <span className="text-[11px] text-stone-500 -mt-0.5">Empowering Specially Abled</span>
              </span>
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
                {role === "ADMIN" && (
                  <Link href="/admin" className={`flex items-center gap-1 text-sm font-medium ${pathname.includes('/admin') ? 'text-[#2D4A22] border-b-2 border-[#2D4A22] pb-1' : 'text-stone-500 hover:text-stone-800 transition-colors'}`}>
                    <LayoutDashboard className="w-4 h-4" /> Admin Portal
                  </Link>
                )}
                <Link href="/attendance" className={`flex items-center gap-1 text-sm font-medium ${pathname.includes('/attendance') ? 'text-[#2D4A22] border-b-2 border-[#2D4A22] pb-1' : 'text-stone-500 hover:text-stone-800 transition-colors'}`}>
                  <FileBarChart className="w-4 h-4" /> Attendance
                </Link>
                <Link href="/report-cards" className={`flex items-center gap-1 text-sm font-medium ${pathname.includes('/report-cards') ? 'text-[#2D4A22] border-b-2 border-[#2D4A22] pb-1' : 'text-stone-500 hover:text-stone-800 transition-colors'}`}>
                  <FileBarChart className="w-4 h-4" /> Report Cards
                </Link>
              </>
            )}

            {/* Syllabus — visible to every signed-in role */}
            {session && (
              <Link href="/syllabus" className="text-stone-600 hover:text-stone-900 px-3 py-2 text-sm font-medium">Syllabus</Link>
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
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
