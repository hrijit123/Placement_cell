"use client";

import { useState, useEffect } from "react";

export default function SyllabusClient({ role, cohorts }: { role: string, cohorts: any[] }) {
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    cohortId: cohorts.length > 0 ? cohorts[0].id : "",
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    targetChapters: "",
    completedChapters: "",
    pendingChapters: ""
  });

  const loadSyllabi = async () => {
    setLoading(true);
    const res = await fetch("/api/syllabus");
    if (res.ok) setSyllabi(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    loadSyllabi();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cohortId || !form.targetChapters) return;
    
    await fetch("/api/syllabus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    
    setForm({ ...form, targetChapters: "", completedChapters: "", pendingChapters: "" });
    loadSyllabi();
  };

  return (
    <div className="space-y-8">
      {role === "TEACHER" && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
          <h2 className="text-xl font-serif text-[#2C241B] mb-4">Log Syllabus Progress</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Cohort</label>
              <select value={form.cohortId} onChange={e => setForm({...form, cohortId: e.target.value})} className="w-full border p-2 rounded">
                {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Month</label>
              <input value={form.month} onChange={e => setForm({...form, month: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold mb-1">Target Chapters</label>
              <textarea value={form.targetChapters} onChange={e => setForm({...form, targetChapters: e.target.value})} className="w-full border p-2 rounded" rows={2} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold mb-1">Completed Chapters</label>
              <textarea value={form.completedChapters} onChange={e => setForm({...form, completedChapters: e.target.value})} className="w-full border p-2 rounded" rows={2} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold mb-1">Pending Chapters</label>
              <textarea value={form.pendingChapters} onChange={e => setForm({...form, pendingChapters: e.target.value})} className="w-full border p-2 rounded" rows={2} />
            </div>
          </div>
          <button type="submit" className="mt-4 bg-[#2C241B] text-white px-6 py-2 rounded text-sm font-semibold hover:bg-black">
            Save Record
          </button>
        </form>
      )}

      <div className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
        <h2 className="text-xl font-serif text-[#2C241B] mb-4">Syllabus History</h2>
        {loading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {syllabi.map(s => (
              <div key={s.id} className="border border-[#E1D8C9] p-4 rounded bg-[#FAF8F3]">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-[#2C241B]">{s.cohort?.name} - {s.month}</h3>
                    <p className="text-xs text-[#6B5E4C]">By {s.teacher?.name} on {new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                  <div className="text-stone-800 font-medium">
                    <span className="block font-bold text-stone-700 uppercase text-xs mb-1 tracking-wide">Target</span>
                    {s.targetChapters}
                  </div>
                  <div className="text-stone-800 font-medium">
                    <span className="block font-bold text-emerald-700 uppercase text-xs mb-1 tracking-wide">Completed</span>
                    {s.completedChapters}
                  </div>
                  <div className="text-stone-800 font-medium">
                    <span className="block font-bold text-amber-700 uppercase text-xs mb-1 tracking-wide">Pending</span>
                    {s.pendingChapters}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
