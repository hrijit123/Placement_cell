"use client";

import { useCallback, useEffect, useState } from "react";

type StaffRecord = {
  phone?: string | null;
  address?: string | null;
  designation?: string | null;
  dob?: string | null;
  qualification?: string | null;
  joiningDate?: string | null;
  probationEndDate?: string | null;
  department?: string | null;
  project?: string | null;
  salary?: number | null;
  incrementHistory?: string | null;
  additionalTasks?: string | null;
  workingHours?: string | null;
  subject?: string | null;
  classesTaking?: string | null;
};

type Teacher = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  staffRecord: StaffRecord | null;
};

type Increment = {
  date: string;
  previousSalary: number | null;
  newSalary: number;
  note: string | null;
  changedBy: string;
};

const TEXT_FIELDS: { key: keyof StaffRecord; label: string; wide?: boolean }[] = [
  { key: "phone", label: "Phone Number" },
  { key: "designation", label: "Designation" },
  { key: "qualification", label: "Qualification" },
  { key: "department", label: "Department" },
  { key: "project", label: "Project" },
  { key: "workingHours", label: "Working Hours" },
  { key: "subject", label: "Subject" },
  { key: "classesTaking", label: "Classes Taking" },
  { key: "address", label: "Address", wide: true },
  { key: "additionalTasks", label: "Additional Tasks", wide: true },
];

const DATE_FIELDS: { key: keyof StaffRecord; label: string }[] = [
  { key: "dob", label: "Date of Birth" },
  { key: "joiningDate", label: "Joining Date" },
  { key: "probationEndDate", label: "Probation Completion Date" },
];

const toDateInput = (v: string | null | undefined) => (v ? v.slice(0, 10) : "");

export default function StaffRecordsClient() {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setTeachers(data.teachers);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEditor = (t: Teacher) => {
    const r = t.staffRecord;
    setOpenId(t.id);
    setSavedMsg(null);
    setForm({
      phone: r?.phone || "",
      address: r?.address || "",
      designation: r?.designation || "",
      dob: toDateInput(r?.dob),
      qualification: r?.qualification || "",
      joiningDate: toDateInput(r?.joiningDate),
      probationEndDate: toDateInput(r?.probationEndDate),
      department: r?.department || "",
      project: r?.project || "",
      salary: r?.salary != null ? String(r.salary) : "",
      incrementNote: "",
      additionalTasks: r?.additionalTasks || "",
      workingHours: r?.workingHours || "",
      subject: r?.subject || "",
      classesTaking: r?.classesTaking || "",
    });
  };

  const save = async (userId: string) => {
    setSaving(true);
    setSavedMsg(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...form, salary: form.salary === "" ? null : form.salary }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSavedMsg("Record saved.");
      await load();
    } catch (e: any) {
      setSavedMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <p className="text-red-700 bg-red-50 border border-red-200 rounded p-4">Error: {error}</p>;
  if (!teachers) return <p className="text-[#8B7D6B] italic">Loading teacher records…</p>;
  if (teachers.length === 0) {
    return (
      <p className="text-[#8B7D6B] bg-white border border-[#E1D8C9] rounded p-6">
        No teachers found. Teachers appear here after they sign in and receive the TEACHER role.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {teachers.map((t) => {
        const isOpen = openId === t.id;
        let increments: Increment[] = [];
        try {
          increments = t.staffRecord?.incrementHistory ? JSON.parse(t.staffRecord.incrementHistory) : [];
          if (!Array.isArray(increments)) increments = [];
        } catch { increments = []; }

        return (
          <div key={t.id} className="bg-white border border-[#E1D8C9] rounded shadow-sm">
            <button
              onClick={() => (isOpen ? setOpenId(null) : openEditor(t))}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#FAF8F3] transition-colors"
            >
              <div>
                <p className="font-semibold text-[#2C241B]">{t.name || "Unnamed"} <span className="font-normal text-sm text-[#8B7D6B]">· {t.email}</span></p>
                <p className="text-sm text-[#6B5E4C]">
                  {t.staffRecord?.designation || "No designation set"}
                  {t.staffRecord?.department ? ` · ${t.staffRecord.department}` : ""}
                  {t.staffRecord?.subject ? ` · ${t.staffRecord.subject}` : ""}
                </p>
              </div>
              <span className="text-sm text-[#8B7D6B]">{isOpen ? "▲ Close" : "▼ View / Edit"}</span>
            </button>

            {isOpen && (
              <div className="border-t border-[#F5F0E6] px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  {DATE_FIELDS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">{label}</label>
                      <input
                        type="date"
                        value={form[key as string] || ""}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  {TEXT_FIELDS.map(({ key, label, wide }) => (
                    <div key={key} className={wide ? "md:col-span-2" : ""}>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">{label}</label>
                      {wide ? (
                        <textarea
                          value={form[key as string] || ""}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7] min-h-[60px]"
                        />
                      ) : (
                        <input
                          value={form[key as string] || ""}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 border-t border-[#F5F0E6] pt-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Salary (₹ / month)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.salary || ""}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Increment Note (saved with salary change)</label>
                    <input
                      value={form.incrementNote || ""}
                      onChange={(e) => setForm({ ...form, incrementNote: e.target.value })}
                      placeholder="e.g. Annual increment 2026"
                      className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]"
                    />
                  </div>
                </div>

                {increments.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#2C241B] mb-2">Increment History</h4>
                    <ul className="text-sm text-[#6B5E4C] space-y-1 bg-[#FAF8F3] border border-[#F5F0E6] rounded p-3">
                      {[...increments].reverse().map((inc, i) => (
                        <li key={i}>
                          {new Date(inc.date).toLocaleDateString("en-IN")} —
                          {inc.previousSalary != null ? ` ₹${inc.previousSalary.toLocaleString("en-IN")} →` : " Set to"}
                          {" "}₹{inc.newSalary.toLocaleString("en-IN")}
                          {inc.note ? ` (${inc.note})` : ""}
                          <span className="text-[#8B7D6B]"> · by {inc.changedBy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => save(t.id)}
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#2D4A22] text-white rounded font-semibold text-sm hover:bg-[#1f3418] disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save Record"}
                  </button>
                  {savedMsg && (
                    <span className={`text-sm ${savedMsg.startsWith("Error") ? "text-red-700" : "text-emerald-700"}`}>{savedMsg}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
