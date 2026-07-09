"use client";

import { useState, useEffect } from "react";

type AssignCohortModalProps = {
  profileId: string;
  onClose: () => void;
};

export default function AssignCohortModal({ profileId, onClose }: AssignCohortModalProps) {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [newCohortName, setNewCohortName] = useState("");
  const [newCohortDesc, setNewCohortDesc] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/cohorts").then(res => res.json()),
      fetch("/api/admin/staff").then(res => res.json())
    ]).then(([cohortsData, staffData]) => {
      setCohorts(Array.isArray(cohortsData) ? cohortsData : []);
      setTeachers(Array.isArray(staffData?.teachers) ? staffData.teachers : []);
      setLoading(false);
    });
  }, []);

  const handleAssign = async (cohortId: string) => {
    try {
      await fetch("/api/admin/cohorts/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, cohortId })
      });
      alert("Successfully assigned cohort!");
      onClose();
    } catch (e) {
      alert("Error assigning cohort");
    }
  };

  const handleCreateAndAssign = async () => {
    if (!newCohortName || !selectedTeacherId) return alert("Missing fields");
    
    try {
      const res = await fetch("/api/admin/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCohortName, description: newCohortDesc, teacherId: selectedTeacherId })
      });
      const newCohort = await res.json();
      
      if (newCohort.id) {
        await handleAssign(newCohort.id);
      }
    } catch (e) {
      alert("Error creating cohort");
    }
  };

  if (loading) return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">Loading...</div>;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full border border-[#E1D8C9]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-serif font-bold text-[#2C241B]">Assign Cohort</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-800">&times;</button>
        </div>

        <div className="flex gap-4 mb-4 border-b border-[#E1D8C9]">
          <button onClick={() => setIsCreating(false)} className={`pb-2 ${!isCreating ? 'border-b-2 border-[#2D4A22] font-bold' : ''}`}>Assign Existing</button>
          <button onClick={() => setIsCreating(true)} className={`pb-2 ${isCreating ? 'border-b-2 border-[#2D4A22] font-bold' : ''}`}>Create New</button>
        </div>

        {!isCreating ? (
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {cohorts.length === 0 ? <p className="text-sm text-stone-500">No cohorts exist yet.</p> : null}
            {cohorts.map(c => (
              <div key={c.id} className="flex justify-between items-center p-3 border rounded border-stone-200">
                <div>
                  <div className="font-semibold text-stone-800">{c.name}</div>
                  <div className="text-xs text-stone-500">Teacher: {c.teacher?.name || 'Unknown'}</div>
                </div>
                <button onClick={() => handleAssign(c.id)} className="bg-[#2C241B] text-white px-3 py-1 text-xs rounded hover:bg-black">
                  Assign
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Cohort Name</label>
              <input value={newCohortName} onChange={e => setNewCohortName(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. Web Dev 2026" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Teacher</label>
              <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Select Teacher...</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
              </select>
            </div>
            <button onClick={handleCreateAndAssign} className="w-full bg-[#2D4A22] text-white py-2 rounded hover:bg-green-900 font-semibold mt-4">
              Create & Assign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
