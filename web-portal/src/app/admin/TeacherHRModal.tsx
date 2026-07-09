"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function TeacherHRModal({ teacher, onClose, onSaved }: { teacher: any, onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState<any>({
    phone: "", address: "", designation: "", dob: "", qualification: "",
    joiningDate: "", probationEndDate: "", department: "", project: "",
    salary: "", additionalTasks: "", workingHours: "", subject: "", classesTaking: "",
    incrementNote: ""
  });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (teacher.staffRecord) {
      const tp = teacher.staffRecord;
      setForm({
        phone: tp.phone || "",
        address: tp.address || "",
        designation: tp.designation || "",
        dob: tp.dob ? new Date(tp.dob).toISOString().split('T')[0] : "",
        qualification: tp.qualification || "",
        joiningDate: tp.joiningDate ? new Date(tp.joiningDate).toISOString().split('T')[0] : "",
        probationEndDate: tp.probationEndDate ? new Date(tp.probationEndDate).toISOString().split('T')[0] : "",
        department: tp.department || "",
        project: tp.project || "",
        salary: tp.salary || "",
        incrementNote: "",
        additionalTasks: tp.additionalTasks || "",
        workingHours: tp.workingHours || "",
        subject: tp.subject || "",
        classesTaking: tp.classesTaking || ""
      });
      try {
        setHistory(tp.incrementHistory ? JSON.parse(tp.incrementHistory) : []);
      } catch (e) {
        setHistory([]);
      }
    }
  }, [teacher]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: teacher.id, ...form })
      });
      if (!res.ok) throw new Error("Failed to save");
      alert("Teacher HR Record saved!");
      onSaved();
      onClose();
    } catch (e) {
      alert("Error saving record");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-[#E1D8C9] flex justify-between items-center bg-[#FAF8F3] rounded-t-lg shrink-0">
          <div>
            <h2 className="text-2xl font-serif text-[#2C241B]">{teacher.name}</h2>
            <p className="text-sm text-[#6B5E4C]">HR & Operational Record</p>
          </div>
          <button onClick={onClose} className="text-2xl text-stone-500 hover:text-stone-800">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-2 gap-4">
          <div className="col-span-2 text-[#2C241B] font-serif font-bold text-lg border-b pb-1 mb-2">Personal & Contact</div>
          {['phone', 'dob', 'address'].map(key => (
            <div key={key} className={key === 'address' ? "col-span-2" : ""}>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              {key === 'address' ? (
                <textarea value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full border border-stone-300 p-2 rounded" rows={2}/>
              ) : (
                <input type={key === 'dob' ? 'date' : 'text'} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full border border-stone-300 p-2 rounded"/>
              )}
            </div>
          ))}

          <div className="col-span-2 text-[#2C241B] font-serif font-bold text-lg border-b pb-1 mb-2 mt-4">Professional & Academic</div>
          {['designation', 'qualification', 'joiningDate', 'probationEndDate', 'department', 'project'].map(key => (
            <div key={key}>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <input type={['joiningDate', 'probationEndDate'].includes(key) ? 'date' : 'text'} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full border border-stone-300 p-2 rounded"/>
            </div>
          ))}

          <div className="col-span-2 text-[#2C241B] font-serif font-bold text-lg border-b pb-1 mb-2 mt-4">Duties & Responsibilities</div>
          {['subject', 'classesTaking', 'workingHours', 'additionalTasks'].map(key => (
            <div key={key} className={key === 'additionalTasks' ? "col-span-2" : ""}>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              {key === 'additionalTasks' ? (
                <textarea value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full border border-stone-300 p-2 rounded" rows={2}/>
              ) : (
                <input type="text" value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full border border-stone-300 p-2 rounded"/>
              )}
            </div>
          ))}

          <div className="col-span-2 text-[#2C241B] font-serif font-bold text-lg border-b pb-1 mb-2 mt-4">Compensation</div>
          <div>
            <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Current Salary</label>
            <input type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} className="w-full border border-stone-300 p-2 rounded"/>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Increment Note (Optional)</label>
            <input type="text" placeholder="Reason for salary change" value={form.incrementNote} onChange={e => setForm({...form, incrementNote: e.target.value})} className="w-full border border-stone-300 p-2 rounded"/>
          </div>

          {history.length > 0 && (
            <div className="col-span-2 mt-2">
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-2">Increment History</label>
              <div className="bg-[#FAF8F3] border border-[#E1D8C9] rounded p-4 space-y-2 max-h-40 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="text-sm text-[#3E362E] border-b border-[#E1D8C9] last:border-0 pb-2 last:pb-0">
                    <div className="font-semibold">{format(new Date(h.date), "MMM d, yyyy")} - by {h.changedBy || "System"}</div>
                    <div>Changed from <span className="font-medium font-mono">₹{h.previousSalary || 0}</span> to <span className="font-medium font-mono text-emerald-700">₹{h.newSalary}</span></div>
                    {h.note && <div className="text-stone-500 italic text-xs mt-1">"{h.note}"</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#E1D8C9] bg-stone-50 rounded-b-lg flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2 rounded font-semibold text-stone-600 hover:bg-stone-200">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-6 py-2 rounded font-semibold bg-[#2C241B] text-white hover:bg-black disabled:opacity-50">
            {loading ? "Saving..." : "Save Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
