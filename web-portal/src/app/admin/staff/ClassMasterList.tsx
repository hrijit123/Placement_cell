"use client";

import { useState, useEffect } from "react";

type PredefinedClass = {
  id: string;
  name: string;
};

export default function ClassMasterList() {
  const [classes, setClasses] = useState<PredefinedClass[]>([]);
  const [newClass, setNewClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/admin/predefined-classes");
      if (res.ok) {
        setClasses(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.trim()) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/predefined-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClass })
      });
      if (res.ok) {
        setNewClass("");
        fetchClasses();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add class");
      }
    } catch (e) {
      setError("An error occurred");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-[#E1D8C9] mb-8 shadow-sm">
      <h2 className="text-xl font-serif text-[#2C241B] mb-4">Class Master List</h2>
      <p className="text-sm text-stone-500 mb-4">Add classes here to make them available in the dropdown when assigning to teachers.</p>
      
      <form onSubmit={handleAddClass} className="flex gap-3 mb-6">
        <input 
          type="text" 
          value={newClass} 
          onChange={e => setNewClass(e.target.value)} 
          placeholder="e.g. Web Dev 2026 Batch A"
          className="flex-1 border border-stone-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
        />
        <button type="submit" className="bg-[#2D4A22] text-white px-4 py-2 rounded text-sm font-semibold hover:bg-emerald-800 transition-colors">
          Add Class
        </button>
      </form>
      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

      {loading ? (
        <div className="text-stone-400 text-sm">Loading...</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {classes.length === 0 ? (
            <span className="text-stone-400 text-sm italic">No classes defined yet.</span>
          ) : (
            classes.map(c => (
              <span key={c.id} className="bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 rounded-full text-xs font-semibold">
                {c.name}
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
}
