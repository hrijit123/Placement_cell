"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import NotificationsDropdown from "./NotificationsDropdown";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-serif text-stone-900 font-bold hover:text-emerald-700 transition-colors">
              ISL Connect
            </Link>
          </div>

          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="text-stone-600 hover:text-stone-900 px-3 py-2 text-sm font-medium">Home</Link>
            
            {/* Candidate Links */}
            {(session as any)?.user?.role === "STUDENT" && (
              <>
                <Link href="/router?role=STUDENT" className="text-stone-600 hover:text-stone-900 px-3 py-2 text-sm font-medium">My Record</Link>
              </>
            )}

            {/* Staff Links */}
            {((session as any)?.user?.role === "TEACHER" || (session as any)?.user?.role === "ADMIN") && (
              <>
                <Link href="/staff" className="text-stone-600 hover:text-stone-900 px-3 py-2 text-sm font-medium">Staff Portal</Link>
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
