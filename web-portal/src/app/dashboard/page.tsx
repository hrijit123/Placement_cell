"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DashboardHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const role = (session?.user as any)?.role;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#2D4A22] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session || (role !== "ADMIN" && role !== "TEACHER")) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-center p-10">
        <h1 className="text-3xl font-serif text-[#2C241B] mb-3">Staff Access Only</h1>
        <p className="text-[#6B5E4C] max-w-md">
          The placement cell dashboard is available to NGO teachers and administrators.
          Please sign in with a staff account.
        </p>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = studentId.trim();
    if (id) router.push(`/dashboard/student/${encodeURIComponent(id)}`);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 border-b border-[#E1D8C9] pb-6">
          <h1 className="text-4xl font-serif text-[#2C241B] mb-2">Placement Cell Dashboard</h1>
          <p className="text-[#6B5E4C]">
            {role === "TEACHER"
              ? "Look up students in your assigned cohorts. Some sensitive fields are restricted."
              : "Look up any student's full 360° dossier."}
          </p>
        </header>

        <form onSubmit={submit} className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9]">
          <label htmlFor="studentId" className="block text-sm uppercase tracking-wider text-[#6B5E4C] mb-2 font-semibold">
            Student ID
          </label>
          <div className="flex gap-3">
            <input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. ISL-2024-001"
              className="flex-1 border border-[#E1D8C9] rounded px-4 py-3 bg-[#FDFBF7] focus:outline-none focus:ring-2 focus:ring-[#2D4A22] text-[#2C241B]"
              autoFocus
            />
            <button
              type="submit"
              disabled={!studentId.trim()}
              className="px-6 py-3 bg-[#2C241B] text-[#FDFBF7] font-semibold rounded hover:bg-[#1A1510] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Open Dossier
            </button>
          </div>
          <p className="text-xs text-[#8B7D6B] mt-3">
            Every dossier access is logged for auditing purposes.
          </p>
        </form>
      </div>
    </div>
  );
}
