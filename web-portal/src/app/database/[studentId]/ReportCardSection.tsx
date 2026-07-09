"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ExamRecord = {
  id: string;
  academicYear: string;
  subject: string;
  examName: string;
  marks: number | null;
  maxMarks: number;
};

const defaultYear = () => {
  const now = new Date();
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
};

export default function ReportCardSection({
  studentId,
  studentName,
  className,
}: {
  studentId: string;
  studentName?: string | null;
  className?: string | null;
}) {
  const [records, setRecords] = useState<ExamRecord[] | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(defaultYear());
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    subject: "",
    examName: "",
    marks: "",
    maxMarks: "100",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}/exams`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setRecords(data.records);
      setCanEdit(data.canEdit);
    } catch (e: any) {
      setError(e.message);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const years = useMemo(() => {
    const ys = new Set((records || []).map((r) => r.academicYear));
    ys.add(defaultYear());
    return [...ys].sort().reverse();
  }, [records]);

  const yearRecords = (records || []).filter((r) => r.academicYear === year);

  const overall = useMemo(() => {
    let obtained = 0;
    let max = 0;
    for (const r of yearRecords) {
      if (r.marks != null) {
        obtained += r.marks;
        max += r.maxMarks;
      }
    }
    return { obtained, max, pct: max > 0 ? (obtained / max) * 100 : null };
  }, [yearRecords]);

  // Group records by subject for display
  const subjectGroups = useMemo(() => {
    const groups: Record<string, ExamRecord[]> = {};
    for (const r of yearRecords) {
      if (!groups[r.subject]) groups[r.subject] = [];
      groups[r.subject].push(r);
    }
    return groups;
  }, [yearRecords]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}/exams`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academicYear: year, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg("Marks saved.");
      setForm({ ...form, subject: "", examName: "", marks: "" });
      await load();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (id: string) => {
    await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}/exams?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  };

  if (error) return <p className="text-red-700 bg-red-50 border border-red-200 rounded p-4">Error: {error}</p>;
  if (!records) return <p className="text-[#8B7D6B] italic p-4">Loading report card…</p>;

  return (
    <div className="space-y-6">
      {/* Print-only styles: show only the report card when printing */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-card-print, #report-card-print * { visibility: visible; }
          #report-card-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {canEdit && (
        <form onSubmit={save} className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
          <h2 className="text-xl font-serif text-[#2C241B] mb-4">Enter / Update Marks</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Subject</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Mathematics"
                className="w-full border border-stone-400 font-medium rounded px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Exam Name</label>
              <input
                required
                value={form.examName}
                onChange={(e) => setForm({ ...form, examName: e.target.value })}
                placeholder="e.g. Term 1"
                className="w-full border border-stone-400 font-medium rounded px-3 py-2 text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Marks Obtained</label>
              <input 
                type="number" 
                step="0.5" 
                min="0" 
                value={form.marks} 
                onChange={(e) => setForm({ ...form, marks: e.target.value })} 
                className="w-full border border-stone-400 font-medium rounded px-3 py-2 text-sm bg-white" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Max Marks</label>
              <input 
                type="number" 
                min="1" 
                required 
                value={form.maxMarks} 
                onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} 
                className="w-full border border-stone-400 font-medium rounded px-3 py-2 text-sm bg-white" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <button type="submit" disabled={saving} className="px-6 py-2 bg-[#2D4A22] text-white rounded font-semibold text-sm hover:bg-[#1f3418] disabled:opacity-50">
              {saving ? "Saving…" : "Save Mark"}
            </button>
            {msg && <span className={`text-sm ${msg.startsWith("Error") ? "text-red-700" : "text-emerald-700"}`}>{msg}</span>}
          </div>
        </form>
      )}

      <div id="report-card-print" className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-serif text-[#2C241B]">Progress Report</h2>
            <p className="text-sm text-[#6B5E4C]">
              {studentName || "Student"} · {studentId}
              {className ? ` · ${className}` : ""} · Academic Year {year}
            </p>
            <p className="text-xs text-[#8B7D6B] mt-1">Deeds Connect · DEEDS Public Charitable Trust</p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7] text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-[#E1D8C9] rounded text-sm hover:bg-[#FAF8F3] font-medium"
            >
              🖨 Print Report Card
            </button>
          </div>
        </div>

        {yearRecords.length === 0 ? (
          <p className="text-[#8B7D6B] italic py-8 text-center">No marks recorded for {year} yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-[#E1D8C9] text-[#6B5E4C]">
                    <th className="py-2.5 px-3 font-semibold">Subject</th>
                    <th className="py-2.5 px-3 font-semibold">Exam</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Marks</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Max</th>
                    <th className="py-2.5 px-3 font-semibold text-right">%</th>
                    {canEdit && <th className="py-2.5 px-3 print:hidden" />}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(subjectGroups).map(([subject, exams]) => {
                    return exams.map((r, idx) => (
                      <tr key={r.id} className="border-b border-[#F5F0E6] hover:bg-[#FAF8F3]">
                        <td className="py-2.5 px-3 font-medium text-[#2C241B]">
                          {idx === 0 ? subject : ""}
                        </td>
                        <td className="py-2.5 px-3 text-[#6B5E4C]">{r.examName}</td>
                        <td className="py-2.5 px-3 text-right">
                          {r.marks != null ? r.marks : <span className="text-stone-300">—</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right text-stone-500">{r.maxMarks}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {r.marks != null ? `${((r.marks / r.maxMarks) * 100).toFixed(1)}%` : "—"}
                        </td>
                        {canEdit && (
                          <td className="py-2.5 px-3 text-right print:hidden">
                            <button onClick={() => removeRow(r.id)} className="text-xs px-2 py-1 border border-red-200 text-red-700 rounded hover:bg-red-50">Delete</button>
                          </td>
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#E1D8C9] font-semibold text-[#2C241B]">
                    <td className="py-3 px-3">Overall Total</td>
                    <td className="py-3 px-3"></td>
                    <td className="py-3 px-3 text-right">{overall.obtained}</td>
                    <td className="py-3 px-3 text-right">{overall.max}</td>
                    <td className="py-3 px-3 text-right text-lg">
                      {overall.pct != null ? `${overall.pct.toFixed(1)}%` : "—"}
                    </td>
                    {canEdit && <td className="print:hidden" />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
