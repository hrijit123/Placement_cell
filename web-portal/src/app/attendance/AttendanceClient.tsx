"use client";

import { useCallback, useEffect, useState } from "react";

const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-800",
  ABSENT: "bg-red-100 text-red-800",
  LATE: "bg-amber-100 text-amber-800",
  LEAVE: "bg-blue-100 text-blue-800",
};

type MonthlyRow = {
  profileId: string;
  name: string;
  studentId: string | null;
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  LEAVE: number;
  total: number;
  percentage: number | null;
};

type MonthlyReport = {
  month: string;
  rows: MonthlyRow[];
  totals: { PRESENT: number; ABSENT: number; LATE: number; LEAVE: number; total: number; percentage: number | null };
};

export default function AttendanceClient({ initialStudents }: { initialStudents: any[] }) {
  const [tab, setTab] = useState<"daily" | "monthly">("daily");
  const [students, setStudents] = useState(initialStudents);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventDesc, setEventDesc] = useState("");

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const markAttendance = async (profileId: string, status: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, date: selectedDate, status, classOrEvent: eventDesc })
      });
      if (res.ok) {
        const newRecord = await res.json();
        setStudents(prev => prev.map(s => {
          if (s.id === profileId) {
            return { ...s, attendance: [newRecord, ...s.attendance] };
          }
          return s;
        }));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const loadReport = useCallback(async (m: string) => {
    setReport(null);
    setReportError(null);
    try {
      const res = await fetch(`/api/attendance?month=${encodeURIComponent(m)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load report");
      setReport(data);
    } catch (e: any) {
      setReportError(e.message);
    }
  }, []);

  useEffect(() => {
    if (tab === "monthly") loadReport(month);
  }, [tab, month, loadReport]);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[#E1D8C9]">
        {([["daily", "Daily Marking"], ["monthly", "Monthly Report & Analytics"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-6 py-3 font-semibold border-b-2 ${tab === key ? "border-[#2C241B] text-[#2C241B]" : "border-transparent text-[#8B7D6B] hover:text-[#2C241B]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "daily" && (
        <div className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-stone-400 text-stone-900 font-medium p-2 rounded w-48 focus:outline-none focus:border-[#2D4A22] focus:ring-1 focus:ring-[#2D4A22]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Class or Event (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Resume Building Workshop"
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                className="border border-stone-400 text-stone-900 font-medium placeholder:text-stone-500 p-2 rounded w-full focus:outline-none focus:border-[#2D4A22] focus:ring-1 focus:ring-[#2D4A22]"
              />
            </div>
          </div>

          <table className="w-full text-left text-sm text-[#3E362E]">
            <thead className="bg-[#FAF8F3] text-[#6B5E4C] uppercase text-xs">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Student ID</th>
                <th className="p-3">Recent Records</th>
                <th className="p-3">Action for Selected Date</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const hasMarkedToday = student.attendance.some(
                  (a: any) => new Date(a.date).toISOString().split("T")[0] === selectedDate
                );
                return (
                  <tr key={student.id} className="border-b border-[#E1D8C9]">
                    <td className="p-3 font-semibold">{student.name || student.user?.name || "Unknown"}</td>
                    <td className="p-3 font-mono">{student.studentId || "N/A"}</td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {student.attendance.slice(0, 3).map((a: any) => (
                          <span key={a.id} className={`text-[10px] px-2 py-1 rounded ${STATUS_STYLES[a.status] || "bg-stone-100 text-stone-600"}`}>
                            {new Date(a.date).toLocaleDateString()} {a.status}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {hasMarkedToday ? (
                        <span className="text-gray-500 italic">Marked</span>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => markAttendance(student.id, "PRESENT")}
                            disabled={loading}
                            className="bg-[#2D4A22] text-white px-3 py-1 rounded hover:bg-[#1f3418] disabled:opacity-50"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => markAttendance(student.id, "LATE")}
                            disabled={loading}
                            className="bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 disabled:opacity-50"
                          >
                            Late
                          </button>
                          <button
                            onClick={() => markAttendance(student.id, "ABSENT")}
                            disabled={loading}
                            className="bg-red-700 text-white px-3 py-1 rounded hover:bg-red-800 disabled:opacity-50"
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => markAttendance(student.id, "LEAVE")}
                            disabled={loading}
                            className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 disabled:opacity-50"
                          >
                            Leave
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "monthly" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9] flex items-end gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border border-stone-400 text-stone-900 font-medium p-2 rounded w-48 focus:outline-none focus:border-[#2D4A22] focus:ring-1 focus:ring-[#2D4A22]"
              />
            </div>
            <p className="text-xs text-[#8B7D6B] pb-2">
              Attendance % = (Present + Late) ÷ (Total − Leave). Leave days are excluded as approved absences.
            </p>
          </div>

          {reportError && <p className="text-red-700 bg-red-50 border border-red-200 rounded p-4">Error: {reportError}</p>}
          {!report && !reportError && <p className="text-[#8B7D6B] italic">Loading report…</p>}

          {report && (
            <>
              {/* Analytics summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <SummaryCard label="Attendance %" value={report.totals.percentage != null ? `${report.totals.percentage}%` : "—"} highlight />
                <SummaryCard label="Present" value={report.totals.PRESENT} />
                <SummaryCard label="Late" value={report.totals.LATE} />
                <SummaryCard label="Absent" value={report.totals.ABSENT} />
                <SummaryCard label="Leave" value={report.totals.LEAVE} />
              </div>

              {/* Per-student table */}
              <div className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9] overflow-x-auto">
                {report.rows.length === 0 ? (
                  <p className="text-[#8B7D6B] italic py-6 text-center">No attendance recorded for this month.</p>
                ) : (
                  <table className="w-full text-left text-sm text-[#3E362E]">
                    <thead className="bg-[#FAF8F3] text-[#6B5E4C] uppercase text-xs">
                      <tr>
                        <th className="p-3">Student</th>
                        <th className="p-3">Student ID</th>
                        <th className="p-3 text-center">Present</th>
                        <th className="p-3 text-center">Late</th>
                        <th className="p-3 text-center">Absent</th>
                        <th className="p-3 text-center">Leave</th>
                        <th className="p-3 text-center">Days Marked</th>
                        <th className="p-3 text-right">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((r) => (
                        <tr key={r.profileId} className="border-b border-[#F5F0E6] hover:bg-[#FAF8F3]">
                          <td className="p-3 font-semibold">{r.name}</td>
                          <td className="p-3 font-mono text-xs">{r.studentId || "N/A"}</td>
                          <td className="p-3 text-center text-green-900 font-bold">{r.PRESENT}</td>
                          <td className="p-3 text-center text-amber-900 font-bold">{r.LATE}</td>
                          <td className="p-3 text-center text-red-900 font-bold">{r.ABSENT}</td>
                          <td className="p-3 text-center text-blue-900 font-bold">{r.LEAVE}</td>
                          <td className="p-3 text-center">{r.total}</td>
                          <td className="p-3 text-right">
                            {r.percentage != null ? (
                              <span className={`font-bold ${r.percentage >= 75 ? "text-green-900" : r.percentage >= 50 ? "text-amber-900" : "text-red-900"}`}>
                                {r.percentage}%
                              </span>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`p-5 rounded shadow-sm border ${highlight ? "bg-[#2D4A22] text-white border-[#2D4A22]" : "bg-white border-[#E1D8C9]"}`}>
      <p className={`text-xs uppercase tracking-wider mb-1 ${highlight ? "text-emerald-100" : "text-[#8B7D6B]"}`}>{label}</p>
      <p className="text-3xl font-serif font-semibold">{value}</p>
    </div>
  );
}
