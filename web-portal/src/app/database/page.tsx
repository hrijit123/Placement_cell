"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type StudentRecord = {
  id: string;
  studentId: string | null;
  name: string | null;
  user: { name: string | null; email: string | null } | null;
  cohorts: { name: string }[];
  careerTrack: any[];
};

export default function DatabaseHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showPreRegister, setShowPreRegister] = useState(false);
  const [preRegisterMsg, setPreRegisterMsg] = useState("");
  const [cohorts, setCohorts] = useState<{id: string; name: string}[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    className: "",
    vocation: "",
    disabilityInfo: "",
    expectedSalary: "",
    cohortId: "",
  });
  const role = (session?.user as any)?.role;

  const fetchStudents = () => {
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
  };

  const fetchCohorts = () => {
    fetch("/api/ngo/cohorts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCohorts(data);
      })
      .catch((err) => console.error("Failed to fetch cohorts", err));
  };

  useEffect(() => {
    if (status === "authenticated" && (role === "ADMIN" || role === "TEACHER")) {
      fetchStudents();
      fetchCohorts();
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
    const resolvedName = s.name || s.user?.name || "";
    return (
      (s.studentId && s.studentId.toLowerCase().includes(q)) ||
      resolvedName.toLowerCase().includes(q) ||
      (s.user?.email && s.user.email.toLowerCase().includes(q)) ||
      s.cohorts.some((c) => c.name.toLowerCase().includes(q))
    );
  });

  const handleExport = () => {
    window.location.href = "/api/ngo/students?export=true";
  };

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreRegisterMsg("Registering...");
    try {
      if (!formData.name.trim()) {
        setPreRegisterMsg("Please enter the student's name.");
        return;
      }
      
      const res = await fetch("/api/ngo/students/pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setPreRegisterMsg(`Success! Generated ID: ${data.studentId}`);
        setFormData({ name: "", phone: "", className: "", vocation: "", disabilityInfo: "", expectedSalary: "", cohortId: "" });
        fetchStudents();
      } else {
        const err = await res.json();
        setPreRegisterMsg(err.error || "Failed to register");
      }
    } catch (e) {
      setPreRegisterMsg("An error occurred.");
    }
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
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowPreRegister(true)}
              className="px-4 py-2 bg-[#2D4A22] text-white font-semibold rounded hover:bg-[#1f3317] transition-colors text-sm"
            >
              + Pre-Register Student
            </button>
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
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => router.push(`/database/${s.id}`)}>
                      <td className="px-6 py-4 font-mono text-sm text-[#8B7D6B] whitespace-nowrap">
                        {s.studentId || <span className="text-stone-300">Pending</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#2C241B]">{s.name || s.user?.name || "Unknown"}</div>
                      </td>
                      <td className="px-6 py-4 text-[#6B5E4C]">
                        {s.user?.email || "No email"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {s.cohorts.length > 0 ? (
                            s.cohorts.map((c) => (
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
                            if (s.studentId) router.push(`/database/${encodeURIComponent(s.studentId)}`);
                          }}
                          disabled={!s.studentId}
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

      {showPreRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-xl font-serif font-bold text-[#2C241B]">Pre-Register Student</h2>
              <button onClick={() => { setShowPreRegister(false); setPreRegisterMsg(""); }} className="text-stone-400 hover:text-stone-600">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handlePreRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Student Name *</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full border border-stone-300 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#2D4A22]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Phone Number</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+91 9876543210"
                    className="w-full border border-stone-300 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#2D4A22]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Class / Batch</label>
                  <input
                    value={formData.className}
                    onChange={(e) => setFormData({...formData, className: e.target.value})}
                    placeholder="e.g. Batch A"
                    className="w-full border border-stone-300 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#2D4A22]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Vocation / Interests</label>
                  <input
                    value={formData.vocation}
                    onChange={(e) => setFormData({...formData, vocation: e.target.value})}
                    placeholder="e.g. IT, Tailoring"
                    className="w-full border border-stone-300 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#2D4A22]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Expected Salary</label>
                  <input
                    value={formData.expectedSalary}
                    onChange={(e) => setFormData({...formData, expectedSalary: e.target.value})}
                    placeholder="e.g. 15,000/mo"
                    className="w-full border border-stone-300 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#2D4A22]"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Disability Info / Accommodations</label>
                  <input
                    value={formData.disabilityInfo}
                    onChange={(e) => setFormData({...formData, disabilityInfo: e.target.value})}
                    placeholder="e.g. Needs sign language interpreter"
                    className="w-full border border-stone-300 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#2D4A22]"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Assign to Cohort</label>
                  <select
                    value={formData.cohortId}
                    onChange={(e) => setFormData({...formData, cohortId: e.target.value})}
                    className="w-full border border-stone-300 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-[#2D4A22]"
                    required
                  >
                    <option value="">-- None / Default --</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                {preRegisterMsg && (
                  <div className="col-span-1 md:col-span-2 mt-2 p-3 rounded bg-[#FAF8F3] border border-[#E1D8C9] text-sm font-medium text-stone-800 whitespace-pre-wrap">
                    {preRegisterMsg}
                  </div>
                )}

                <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-stone-100">
                  <button type="button" onClick={() => { setShowPreRegister(false); setPreRegisterMsg(""); }} className="px-4 py-2 border border-stone-300 rounded text-sm text-stone-700 hover:bg-stone-50">Done</button>
                  <button type="submit" className="px-4 py-2 bg-[#2D4A22] text-white rounded text-sm hover:bg-[#1f3317]">Register Student</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
