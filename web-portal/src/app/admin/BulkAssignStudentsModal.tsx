"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

type BulkAssignStudentsModalProps = {
  cohortId: string;
  cohortName: string;
  onClose: () => void;
};

export default function BulkAssignStudentsModal({ cohortId, cohortName, onClose }: BulkAssignStudentsModalProps) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/profiles").then(res => res.json()),
      fetch(`/api/admin/cohorts/${cohortId}/students`).then(res => res.json())
    ]).then(([profilesData, assignedData]) => {
      setProfiles(Array.isArray(profilesData) ? profilesData : []);
      
      const assignedIds = Array.isArray(assignedData) ? assignedData.map(p => p.id) : [];
      setSelectedIds(new Set(assignedIds));
      
      setLoading(false);
    });
  }, [cohortId]);

  const toggleStudent = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cohorts/${cohortId}/students`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileIds: Array.from(selectedIds) })
      });
      if (!res.ok) throw new Error("Failed to save");
      onClose(); // Automatically closes and parent refreshes
    } catch (e) {
      alert("Error saving cohort assignment");
      setSaving(false);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.user.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.studentId?.toLowerCase().includes(search.toLowerCase()) ||
    p.user.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">Loading...</div>;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[85vh] border border-[#E1D8C9] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex justify-between items-start bg-stone-50">
          <div>
            <h3 className="text-xl font-serif font-bold text-[#2C241B]">Manage Students</h3>
            <p className="text-sm text-stone-500 mt-1">Assign students to <strong>{cohortName}</strong></p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800 text-2xl leading-none">&times;</button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-stone-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search by name, ID, or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D4A22] focus:border-transparent text-sm"
            />
          </div>
          <div className="flex justify-between items-center mt-3 text-xs text-stone-500 px-1">
            <span>Showing {filteredProfiles.length} students</span>
            <span>{selectedIds.size} selected</span>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-2">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-10 text-stone-400">No students found.</div>
          ) : (
            <ul className="space-y-1">
              {filteredProfiles.map(p => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <li key={p.id}>
                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${isSelected ? 'bg-emerald-50 border-emerald-200' : 'hover:bg-stone-50 border-transparent'}`}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleStudent(p.id)}
                        className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-stone-800 text-sm truncate">{p.user.name || "Unknown"}</span>
                          <span className="text-xs font-medium text-stone-500">{p.studentId}</span>
                        </div>
                        <div className="text-xs text-stone-500 truncate">{p.user.email} • {p.className || "No Class"}</div>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-6 py-2 bg-[#2D4A22] hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Selection"}
          </button>
        </div>

      </div>
    </div>
  );
}
