"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ExamRecord = {
  id: string;
  academicYear: string;
  subject: string;
  ia1: number | null;
  ia2: number | null;
  ia3: number | null;
  ia4: number | null;
  sem1: number | null;
  sem2: number | null;
  iaMax: number;
  semMax: number;
};

const IA_KEYS = ["ia1", "ia2", "ia3", "ia4"] as const;
const SEM_KEYS = ["sem1", "sem2"] as const;
const ALL_KEYS = [...IA_KEYS, ...SEM_KEYS] as const;

const defaultYear = () => {
  const now = new Date();
  // Academic year starts in April (Indian convention).
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
};

function rowTotals(r: ExamRecord) {
  let obtained = 0;
  let max = 0;
  for (const k of IA_KEYS) {
    if (r[k] != null) { obtained += r[k]!; max += r.iaMax; }
  }
  for (const k of SEM_KEYS) {
    if (r[k] != null) { obtained += r[k]!; max += r.semMax; }
  }
  return { obtained, max, pct: max > 0 ? (obtained / max) * 100 : null };
}

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
    ia1: "", ia2: "", ia3: "", ia4: "",
    sem1: "", sem2: "",
    iaMax: "25", semMax: "100",
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
      const t = rowTotals(r);
      obtained += t.obtained;
      max += t.max;
    }
    return { obtained, max, pct: max > 0 ? (obtained / max) * 100 : null };
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
      setForm({ ...form, subject: "", ia1: "", ia2: "", ia3: "", ia4: "", sem1: "", sem2: "" });
      await load();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const editRow = (r: ExamRecord) => {
    setForm({
      subject: r.subject,
      ia1: r.ia1 != null ? String(r.ia1) : "",
      ia2: r.ia2 != null ? String(r.ia2) : "",
      ia3: r.ia3 != null ? String(r.ia3) : "",
      ia4: r.ia4 != null ? String(r.ia4) : "",
      sem1: r.sem1 != null ? String(r.sem1) : "",
      sem2: r.sem2 != null ? String(r.sem2) : "",
      iaMax: String(r.iaMax),
      semMax: String(r.semMax),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Subject</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Mathematics"
                className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">IA Max Marks</label>
              <input type="number" min="1" value={form.iaMax} onChange={(e) => setForm({ ...form, iaMax: e.target.value })} className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Semester Max Marks</label>
              <input type="number" min="1" value={form.semMax} onChange={(e) => setForm({ ...form, semMax: e.target.value })} className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]" />
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
            {ALL_KEYS.map((k) => (
              <div key={k}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">{k.toUpperCase()}</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#2D4A22] text-white rounded font-semibold text-sm hover:bg-[#1f3418] disabled:opacity-50">
              {saving ? "Saving…" : "Save Marks"}
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
                    <th className="py-2.5 px-3 font-semibold text-center" colSpan={4}>Internal Assessments</th>
                    <th className="py-2.5 px-3 font-semibold text-center" colSpan={2}>Semesters</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Total</th>
                    <th className="py-2.5 px-3 font-semibold text-right">%</th>
                    {canEdit && <th className="py-2.5 px-3 print:hidden" />}
                  </tr>
                  <tr className="border-b border-[#F5F0E6] text-xs text-[#8B7D6B]">
                    <th className="py-1.5 px-3" />
                    <th className="py-1.5 px-3 text-center">IA-1</th>
                    <th className="py-1.5 px-3 text-center">IA-2</th>
                    <th className="py-1.5 px-3 text-center">IA-3</th>
                    <th className="py-1.5 px-3 text-center">IA-4</th>
                    <th className="py-1.5 px-3 text-center">Sem-1</th>
                    <th className="py-1.5 px-3 text-center">Sem-2</th>
                    <th className="py-1.5 px-3" />
                    <th className="py-1.5 px-3" />
                    {canEdit && <th className="py-1.5 px-3 print:hidden" />}
                  </tr>
                </thead>
                <tbody>
                  {yearRecords.map((r) => {
                    const t = rowTotals(r);
                    return (
                      <tr key={r.id} className="border-b border-[#F5F0E6] hover:bg-[#FAF8F3]">
                        <td className="py-2.5 px-3 font-medium text-[#2C241B]">{r.subject}</td>
                        {ALL_KEYS.map((k) => (
                          <td key={k} className="py-2.5 px-3 text-center">
                            {r[k] != null ? r[k] : <span className="text-stone-300">—</span>}
                          </td>
                        ))}
                        <td className="py-2.5 px-3 text-right">{t.obtained} / {t.max}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          {t.pct != null ? `${t.pct.toFixed(1)}%` : "—"}
                        </td>
                        {canEdit && (
                          <td className="py-2.5 px-3 text-right print:hidden whitespace-nowrap">
                            <button onClick={() => editRow(r)} className="text-xs px-2 py-1 border border-[#E1D8C9] rounded hover:bg-white mr-1.5">Edit</button>
                            <button onClick={() => removeRow(r.id)} className="text-xs px-2 py-1 border border-red-200 text-red-700 rounded hover:bg-red-50">Delete</button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#E1D8C9] font-semibold text-[#2C241B]">
                    <td className="py-3 px-3">Overall</td>
                    <td className="py-3 px-3" colSpan={6} />
                    <td className="py-3 px-3 text-right">{overall.obtained} / {overall.max}</td>
                    <td className="py-3 px-3 text-right text-lg">
                      {overall.pct != null ? `${overall.pct.toFixed(1)}%` : "—"}
                    </td>
                    {canEdit && <td className="print:hidden" />}
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-xs text-[#8B7D6B] mt-4">
              IA marks out of {yearRecords[0]?.iaMax ?? 25} each · Semester marks out of {yearRecords[0]?.semMax ?? 100} each.
              Percentage counts only the assessments that have marks entered.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
