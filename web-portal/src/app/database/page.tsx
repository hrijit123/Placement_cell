"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type StudentRecord = {
  id: string;
  studentId: string | null;
  user: { name: string | null; email: string | null };
  cohorts: { name: string }[];
  careerTrack: any[];
};

export default function DatabaseHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "authenticated" && (role === "ADMIN" || role === "TEACHER")) {
      fetch("/api/ngo/students")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setStudents(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch students", err);
          setLoading(false);
        });
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, role]);

  if (status === "loading" || loading) {
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
          The student database is available to NGO teachers and administrators.
          Please sign in with a staff account.
        </p>
      </div>
    );
  }

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.studentId && s.studentId.toLowerCase().includes(q)) ||
      (s.user.name && s.user.name.toLowerCase().includes(q)) ||
      (s.user.email && s.user.email.toLowerCase().includes(q)) ||
      s.cohorts.some((c) => c.name.toLowerCase().includes(q))
    );
  });

  const handleExport = () => {
    window.location.href = "/api/ngo/students?export=true";
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 border-b border-[#E1D8C9] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B] mb-2">Student Database</h1>
            <p className="text-[#6B5E4C]">
              {role === "TEACHER"
                ? "View students in your assigned cohorts."
                : "View the full 360° database of all students."}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-[#2D4A22] text-[#2D4A22] font-semibold rounded hover:bg-[#2D4A22] hover:text-white transition-colors flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
            <a href="/staff" className="px-4 py-2 border border-[#E1D8C9] rounded hover:bg-white text-sm">Back to Portal</a>
          </div>
        </header>

        <div className="bg-white rounded shadow-sm border border-[#E1D8C9] overflow-hidden">
          <div className="p-4 border-b border-[#E1D8C9] bg-[#FAF8F3]">
            <input
              type="text"
              placeholder="Search by ID, name, email, or cohort..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md border border-[#E1D8C9] rounded px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#2D4A22]"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F3] text-[#6B5E4C] uppercase tracking-wider font-semibold border-b border-[#E1D8C9]">
                <tr>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Cohorts</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1D8C9]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-[#8B7D6B]">
                      {search ? "No students match your search." : "No students found in your assigned cohorts."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-[#FAF8F3] transition-colors">
                      <td className="px-6 py-4 font-mono text-[#2D4A22] font-medium">
                        {student.studentId || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#2C241B]">
                        {student.user.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-[#6B5E4C]">
                        {student.user.email || "No email"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {student.cohorts.length > 0 ? (
                            student.cohorts.map((c) => (
                              <span key={c.name} className="px-2 py-0.5 bg-[#E1D8C9] rounded text-xs text-[#3E362E]">
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            if (student.studentId) router.push(`/database/${encodeURIComponent(student.studentId)}`);
                          }}
                          disabled={!student.studentId}
                          className="text-[#2D4A22] hover:underline font-semibold disabled:opacity-50 disabled:no-underline"
                        >
                          View Record &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
