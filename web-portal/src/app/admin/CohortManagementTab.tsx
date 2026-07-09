"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Edit } from "lucide-react";
import BulkAssignStudentsModal from "./BulkAssignStudentsModal";

export default function CohortManagementTab() {
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [newCohortName, setNewCohortName] = useState("");
  const [newCohortDesc, setNewCohortDesc] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  // Manage Students Modal State
  const [managingCohort, setManagingCohort] = useState<{ id: string, name: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [cRes, tRes] = await Promise.all([
      fetch("/api/admin/cohorts"),
      fetch("/api/admin/teachers") // using the existing teachers API
    ]);
    const cData = await cRes.json();
    const tData = await tRes.json();
    setCohorts(Array.isArray(cData) ? cData : []);
    setTeachers(Array.isArray(tData) ? tData : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortName || !selectedTeacherId) return alert("Name and Teacher are required.");
    try {
      const res = await fetch("/api/admin/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCohortName, description: newCohortDesc, teacherId: selectedTeacherId })
      });
      if (res.ok) {
        setIsCreating(false);
        setNewCohortName("");
        setNewCohortDesc("");
        setSelectedTeacherId("");
        fetchData();
      } else {
        alert("Failed to create cohort.");
      }
    } catch (e) {
      alert("Error creating cohort");
    }
  };

  if (loading) return <div className="text-stone-500 py-10 text-center animate-pulse">Loading cohorts...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-serif font-semibold text-[#2C241B]">Cohorts</h2>
          <p className="text-sm text-stone-500">Manage cohorts, assign teachers, and bulk-assign students.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-[#2D4A22] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Cohort
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cohorts.length === 0 ? (
          <div className="col-span-full py-12 bg-white rounded-xl border border-stone-200 text-center">
            <span className="text-4xl mb-3 block">🏫</span>
            <h3 className="font-semibold text-stone-800">No Cohorts Yet</h3>
            <p className="text-stone-500 text-sm mt-1 mb-4">Create your first cohort to start grouping students.</p>
            <button onClick={() => setIsCreating(true)} className="text-emerald-700 text-sm font-semibold hover:underline">
              Create Cohort &rarr;
            </button>
          </div>
        ) : (
          cohorts.map(cohort => (
            <div key={cohort.id} className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-stone-800 text-lg">{cohort.name}</h3>
                  <p className="text-sm text-stone-500 line-clamp-1">{cohort.description || "No description provided."}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1.5 whitespace-nowrap">
                  <Users className="w-3.5 h-3.5" />
                  {cohort._count?.students || 0} Students
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 gap-3">
                <div className="text-sm text-stone-600">
                  <span className="font-medium text-stone-500">Teacher:</span> {cohort.teacher?.name || 'Unassigned'}
                </div>
                <button 
                  onClick={() => setManagingCohort({ id: cohort.id, name: cohort.name })}
                  className="w-full sm:w-auto px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors border border-stone-200"
                >
                  Manage Students
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full border border-stone-200">
            <h3 className="text-xl font-serif font-bold text-stone-800 mb-4">Create New Cohort</h3>
            <form onSubmit={handleCreateCohort} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Cohort Name <span className="text-red-500">*</span></label>
                <input required value={newCohortName} onChange={e => setNewCohortName(e.target.value)} className="w-full border border-stone-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Web Dev 2026 Batch A" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Description</label>
                <input value={newCohortDesc} onChange={e => setNewCohortDesc(e.target.value)} className="w-full border border-stone-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Brief details about the cohort" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Assign Teacher <span className="text-red-500">*</span></label>
                <select required value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="w-full border border-stone-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                  <option value="">Select a Teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#2D4A22] text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {managingCohort && (
        <BulkAssignStudentsModal 
          cohortId={managingCohort.id} 
          cohortName={managingCohort.name} 
          onClose={() => {
            setManagingCohort(null);
            fetchData(); // refresh cohort student counts
          }} 
        />
      )}
    </div>
  );
}
