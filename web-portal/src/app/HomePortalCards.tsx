"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type Portal = {
  key: string;
  title: string;
  description: string;
  features: string[];
  // Role written to /router?role=X (Staff shares the TEACHER role)
  role: "ADMIN" | "TEACHER" | "STUDENT";
  accent: string; // border/button colour classes
  iconBg: string;
  icon: React.ReactNode;
};

const PORTALS: Portal[] = [
  {
    key: "admin",
    title: "Admin Portal",
    description: "Manage NGO placement records, attendance, users, and organization data.",
    features: ["Placement Management", "Student & Employer Management", "Reports & Analytics", "Access Control"],
    role: "ADMIN",
    accent: "hover:border-emerald-700 text-emerald-800",
    iconBg: "bg-emerald-50 text-emerald-700",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    key: "teacher",
    title: "Teacher Portal",
    description: "Update student database, track placement activities, and mark attendance.",
    features: ["Student Database", "Attendance Management", "Placement Tracker", "Interview Updates"],
    role: "TEACHER",
    accent: "hover:border-blue-700 text-blue-800",
    iconBg: "bg-blue-50 text-blue-700",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    key: "student",
    title: "Student Portal",
    description: "View your profile, apply for jobs, track interviews, and upload documents.",
    features: ["My Profile & Documents", "Job Opportunities", "Interview Schedule", "Placement Status"],
    role: "STUDENT",
    accent: "hover:border-purple-700 text-purple-800",
    iconBg: "bg-purple-50 text-purple-700",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
];

export default function HomePortalCards({ signedInRole }: { signedInRole?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Portal | null>(null);
  const [pin, setPin] = useState("");
  const [pinRequired, setPinRequired] = useState(false);
  const [error, setError] = useState(searchParams.get("error")?.replace(/_/g, " ") || "");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selected?.role === "STUDENT") {
      signIn("google", { callbackUrl: `/router?role=${selected?.role}` });
      return;
    }

    if (pinRequired) {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selected?.role, pin })
      });
      if (!res.ok) {
        setError("Invalid PIN");
        return;
      }
    }

    // Google Auth
    signIn("google", { callbackUrl: `/router?role=${selected?.role}` });
  };

  const openPortal = (portal: Portal) => {
    if (signedInRole) {
      // Already signed in — /router switches role (demo behaviour) and redirects.
      router.push(`/router?role=${portal.role}`);
    } else {
      setSelected(portal);
      setPinRequired(portal.role !== "STUDENT");
      setError("");
      setPin("");
    }
  };

  if (selected && !signedInRole) {
    return (
      <div className="flex flex-col items-center bg-white p-12 rounded-2xl shadow-sm border border-stone-200 max-w-md w-full mx-auto">
        <h2 className="text-3xl font-serif font-semibold text-stone-900 mb-2">{selected.title}</h2>
        <p className="text-stone-500 mb-6 text-center">
          {pinRequired ? `Enter the ${selected.title} PIN to continue.` : `Sign in to access your ${selected.title.toLowerCase()} dashboard.`}
        </p>
        <form className="w-full flex flex-col gap-3 mb-4">
          {pinRequired && (
            <div>
              <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">
                {selected.role === "STUDENT" ? "Student ID (PIN)" : "Access PIN"}
              </label>
              <input 
                type={selected.role === "STUDENT" ? "text" : "password"}
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none mb-3 text-center tracking-[0.2em] font-mono text-lg"
                autoFocus
              />
            </div>
          )}
          
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3.5 rounded-xl font-medium transition-all shadow-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
          
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </form>
        <button
          onClick={() => setSelected(null)}
          className="text-stone-400 hover:text-stone-900 text-sm underline underline-offset-4 font-medium transition-colors mt-2"
        >
          Go back
        </button>
      </div>
    );
  }

  let visiblePortals = PORTALS;
  if (signedInRole === "STUDENT") {
    visiblePortals = PORTALS.filter(p => p.key === "student");
  } else if (signedInRole === "TEACHER") {
    visiblePortals = PORTALS.filter(p => p.key === "teacher" || p.key === "staff");
  } else if (signedInRole === "ADMIN") {
    visiblePortals = PORTALS.filter(p => p.key === "admin");
  }

  return (
    <div className="max-w-6xl mx-auto">
      {error && !selected && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
          {error}
        </div>
      )}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${visiblePortals.length === 1 ? 'lg:grid-cols-1 max-w-md mx-auto' : visiblePortals.length === 2 ? 'lg:grid-cols-2 max-w-3xl mx-auto' : ''}`}>
        {visiblePortals.map((portal) => (
          <div
            key={portal.key}
            className={`relative bg-white border border-stone-200 rounded-2xl p-8 flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 ${portal.accent}`}
          >
          {!signedInRole && (
            <span className="absolute top-4 right-4 text-stone-300" title="Sign in required">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </span>
          )}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${portal.iconBg}`}>
            {portal.icon}
          </div>
          <h2 className="text-2xl font-serif font-semibold text-stone-900 mb-2">{portal.title}</h2>
          <p className="text-stone-500 text-sm mb-5">{portal.description}</p>
          <ul className="space-y-2 mb-8 flex-grow">
            {portal.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-stone-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-600 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => openPortal(portal)}
            className="w-full border border-current rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors"
          >
            Go to {portal.title}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      ))}
    </div>
    </div>
  );
}
