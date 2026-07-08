"use client";

import { useCallback, useEffect, useState } from "react";

type Plan = {
  id: string;
  month: string;
  className: string;
  subject: string;
  targetChapters: string;
  completedChapters: string;
  pendingChapters: string;
  updatedAt: string;
  teacher: { name: string | null; email: string | null };
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

const monthLabel = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

export default function SyllabusClient({ role }: { role: string }) {
  const canEdit = role === "TEACHER" || role === "ADMIN";
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [noClass, setNoClass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    month: currentMonth(),
    className: "",
    subject: "",
    targetChapters: "",
    completedChapters: "",
    pendingChapters: "",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setPlans(data.plans);
      setNoClass(Boolean(data.noClass));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/syllabus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg("Syllabus saved.");
      setForm({ ...form, subject: "", targetChapters: "", completedChapters: "", pendingChapters: "" });
      await load();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/syllabus?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  };

  const editPlan = (p: Plan) => {
    setForm({
      month: p.month,
      className: p.className,
      subject: p.subject,
      targetChapters: p.targetChapters,
      completedChapters: p.completedChapters,
      pendingChapters: p.pendingChapters,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) return <p className="text-red-700 bg-red-50 border border-red-200 rounded p-4">Error: {error}</p>;
  if (!plans) return <p className="text-[#8B7D6B] italic">Loading syllabus plans…</p>;

  const months = [...new Set(plans.map((p) => p.month))];

  return (
    <div className="space-y-10">
      {canEdit && (
        <form onSubmit={save} className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
          <h2 className="text-xl font-serif text-[#2C241B] mb-4">Monthly Syllabus Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Month</label>
              <input
                type="month"
                required
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Class</label>
              <input
                required
                placeholder="e.g. Class 10"
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Subject</label>
              <input
                required
                placeholder="e.g. Mathematics"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {([
              ["targetChapters", "Target Chapters"],
              ["completedChapters", "Completed Chapters"],
              ["pendingChapters", "Pending Chapters"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">{label}</label>
                <textarea
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder="One chapter per line"
                  className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7] min-h-[90px]"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#2D4A22] text-white rounded font-semibold text-sm hover:bg-[#1f3418] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Syllabus"}
            </button>
            {msg && <span className={`text-sm ${msg.startsWith("Error") ? "text-red-700" : "text-emerald-700"}`}>{msg}</span>}
          </div>
          <p className="text-xs text-[#8B7D6B] mt-3">
            Saving with the same month, class, and subject updates the existing entry.
          </p>
        </form>
      )}

      {noClass && (
        <p className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-4 text-sm">
          Your profile has no class assigned yet, so no syllabus can be shown. Ask your teacher to set your class in the student database.
        </p>
      )}

      {plans.length === 0 && !noClass ? (
        <p className="text-[#8B7D6B] bg-white border border-[#E1D8C9] rounded p-6 italic">
          No syllabus plans recorded yet.
        </p>
      ) : (
        months.map((month) => (
          <section key={month}>
            <h2 className="text-2xl font-serif text-[#2C241B] mb-4">{monthLabel(month)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.filter((p) => p.month === month).map((p) => {
                const target = p.targetChapters.split("\n").filter(Boolean);
                const done = p.completedChapters.split("\n").filter(Boolean);
                const pending = p.pendingChapters.split("\n").filter(Boolean);
                const progress = target.length > 0 ? Math.min(100, Math.round((done.length / target.length) * 100)) : null;
                return (
                  <div key={p.id} className="bg-white border border-[#E1D8C9] rounded shadow-sm p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-[#2C241B]">{p.subject} <span className="font-normal text-[#8B7D6B]">· {p.className}</span></h3>
                        {role === "ADMIN" && (
                          <p className="text-xs text-[#8B7D6B]">by {p.teacher.name || p.teacher.email}</p>
                        )}
                      </div>
                      {canEdit && (
                        <span className="flex gap-2 shrink-0">
                          <button onClick={() => editPlan(p)} className="text-xs px-2.5 py-1 border border-[#E1D8C9] rounded hover:bg-[#FAF8F3]">Edit</button>
                          <button onClick={() => remove(p.id)} className="text-xs px-2.5 py-1 border border-red-200 text-red-700 rounded hover:bg-red-50">Delete</button>
                        </span>
                      )}
                    </div>

                    {progress !== null && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-[#6B5E4C] mb-1">
                          <span>{done.length} of {target.length} chapters completed</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <div className="h-2 bg-[#F5F0E6] rounded-full overflow-hidden">
                          <div className="h-full bg-[#2D4A22] rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <ChapterList title="Target" items={target} tone="text-stone-700" />
                      <ChapterList title="Completed" items={done} tone="text-emerald-700" />
                      <ChapterList title="Pending" items={pending} tone="text-amber-700" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function ChapterList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-stone-400 italic">—</p>
      ) : (
        <ul className={`space-y-0.5 ${tone}`}>
          {items.map((c, i) => (
            <li key={i} className="text-xs">• {c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
