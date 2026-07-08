"use client";

import { useState, useEffect } from "react";

export default function TeacherHRModal({ teacher, onClose }: { teacher: any, onClose: () => void }) {
  const [form, setForm] = useState<any>({
    phoneNumber: "", address: "", designation: "", dob: "", qualification: "",
    joiningDate: "", probationCompletionDate: "", department: "", project: "",
    salary: "", lastIncrementHistory: "", additionalTasks: "", workingHours: "",
    subject: "", classesTaking: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teacher.teacherProfile) {
      const tp = teacher.teacherProfile;
      setForm({
        phoneNumber: tp.phoneNumber || "",
        address: tp.address || "",
        designation: tp.designation || "",
        dob: tp.dob ? new Date(tp.dob).toISOString().split('T')[0] : "",
        qualification: tp.qualification || "",
        joiningDate: tp.joiningDate ? new Date(tp.joiningDate).toISOString().split('T')[0] : "",
        probationCompletionDate: tp.probationCompletionDate ? new Date(tp.probationCompletionDate).toISOString().split('T')[0] : "",
        department: tp.department || "",
        project: tp.project || "",
        salary: tp.salary || "",
        lastIncrementHistory: tp.lastIncrementHistory || "",
        additionalTasks: tp.additionalTasks || "",
        workingHours: tp.workingHours || "",
        subject: tp.subject || "",
        classesTaking: tp.classesTaking || ""
      });
    }
  }, [teacher]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: teacher.id, ...form })
      });
      alert("Teacher HR Record saved!");
      onClose();
    } catch (e) {
      alert("Error saving record");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-[#E1D8C9] flex justify-between items-center bg-[#FAF8F3] rounded-t-lg">
          <div>
            <h2 className="text-2xl font-serif text-[#2C241B]">{teacher.name}</h2>
            <p className="text-sm text-[#6B5E4C]">HR & Operational Record</p>
          </div>
          <button onClick={onClose} className="text-2xl text-stone-500 hover:text-stone-800">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-2 gap-4">
          {Object.keys(form).map(key => (
            <div key={key} className={['lastIncrementHistory', 'additionalTasks', 'address'].includes(key) ? "col-span-2" : ""}>
              <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              {['lastIncrementHistory', 'additionalTasks', 'address'].includes(key) ? (
                <textarea 
                  value={form[key]} 
                  onChange={e => setForm({...form, [key]: e.target.value})} 
                  className="w-full border border-stone-300 p-2 rounded" 
                  rows={3}
                />
              ) : (
                <input 
                  type={['dob', 'joiningDate', 'probationCompletionDate'].includes(key) ? 'date' : key === 'salary' ? 'number' : 'text'}
                  value={form[key]} 
                  onChange={e => setForm({...form, [key]: e.target.value})} 
                  className="w-full border border-stone-300 p-2 rounded"
                />
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-[#E1D8C9] bg-stone-50 rounded-b-lg flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 rounded font-semibold text-stone-600 hover:bg-stone-200">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="px-6 py-2 rounded font-semibold bg-[#2C241B] text-white hover:bg-black disabled:opacity-50">
            {loading ? "Saving..." : "Save Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
