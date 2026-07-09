"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Search, Save } from "lucide-react";
import Link from "next/link";

type StudentData = {
  id: string; // userId
  name: string;
  email: string;
  profile: {
    id: string; // profileId
    studentId: string; // STU-...
    cohorts: { name: string }[];
  } | null;
  examRecords: any[];
};

export default function ReportCardsClient({ initialStudents }: { initialStudents: StudentData[] }) {
  const defaultYear = () => {
    const now = new Date();
    const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
  };

  const [students, setStudents] = useState<StudentData[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYear, setAcademicYear] = useState(defaultYear());
  const [subject, setSubject] = useState("");
  const [examName, setExamName] = useState("Unit Test 1");
  const [maxMarks, setMaxMarks] = useState("25");
  
  // profileId -> mark
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    return s.name?.toLowerCase().includes(term) || s.profile?.studentId?.toLowerCase().includes(term);
  });

  const handleFetchExisting = async () => {
    if (!subject.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a subject.' });
      return;
    }
    
    // Extract existing marks for this year + subject + examName
    const newMarks: Record<string, string> = {};
    let foundMaxMarks = maxMarks;

    students.forEach(s => {
      if (!s.profile) return;
      const record = s.examRecords.find(r => 
        r.academicYear === academicYear && 
        r.subject.toLowerCase() === subject.toLowerCase() &&
        r.examName.toLowerCase() === examName.toLowerCase()
      );
      
      if (record) {
        if (record.marks !== null && record.marks !== undefined) {
          newMarks[s.profile.id] = String(record.marks);
        }
        if (record.maxMarks) {
          foundMaxMarks = String(record.maxMarks);
        }
      }
    });

    setMarks(newMarks);
    setMaxMarks(foundMaxMarks);
    setStatusMsg({ type: 'success', text: `Loaded existing marks for ${subject} - ${examName}` });
  };

  const handleSaveAll = async () => {
    if (!subject.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a subject before saving.' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    const updates = Object.entries(marks).map(([profileId, val]) => ({
      profileId,
      mark: val === "" ? null : Number(val)
    }));

    try {
      const res = await fetch('/api/ngo/report-cards/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYear,
          subject,
          examName,
          maxMarks: Number(maxMarks),
          updates
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      
      setStatusMsg({ type: 'success', text: 'Successfully saved marks for all selected students.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E1D8C9] overflow-hidden">
      
      {/* Controls Header */}
      <div className="p-6 bg-[#FAF8F3] border-b border-[#E1D8C9] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Academic Year</label>
            <input 
              value={academicYear} 
              onChange={e => setAcademicYear(e.target.value)}
              className="w-full border border-stone-400 text-stone-900 font-medium rounded px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
              placeholder="e.g. 2026-27"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Subject</label>
            <input 
              value={subject} 
              onChange={e => setSubject(e.target.value)}
              className="w-full border border-stone-400 text-stone-900 font-medium rounded px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
              placeholder="e.g. Mathematics"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Exam Name</label>
            <input 
              value={examName} 
              onChange={e => setExamName(e.target.value)}
              className="w-full border border-stone-400 text-stone-900 font-medium rounded px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
              placeholder="e.g. Unit Test 1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Max Marks</label>
            <input 
              type="number"
              value={maxMarks} 
              onChange={e => setMaxMarks(e.target.value)}
              className="w-full border border-stone-400 text-stone-900 font-medium rounded px-3 py-2 text-sm focus:outline-none focus:border-stone-600"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-2">
            <button 
              onClick={handleFetchExisting}
              className="px-4 py-2 border border-[#2C241B] text-[#2C241B] font-semibold text-sm rounded hover:bg-[#2C241B] hover:text-white transition-colors"
            >
              Load Existing Data
            </button>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8B7D6B]" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-400 text-stone-900 font-medium rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#2D4A22]"
            />
          </div>
        </div>

        {statusMsg && (
          <div className={`mt-4 p-3 rounded flex items-center gap-2 text-sm font-medium ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {statusMsg.text}
          </div>
        )}
      </div>

      {/* Student List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#FAF8F3] text-[#6B5E4C] border-b border-[#E1D8C9]">
              <th className="py-3 px-6 font-semibold">Student Name</th>
              <th className="py-3 px-6 font-semibold">Universal ID</th>
              <th className="py-3 px-6 font-semibold">Cohorts</th>
              <th className="py-3 px-6 font-semibold w-48">Marks Obtained</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => {
              if (!s.profile) return null;
              const pid = s.profile.id;
              
              return (
                <tr key={s.id} className="border-b border-[#F5F0E6] hover:bg-[#FAF8F3]">
                  <td className="py-3 px-6 font-medium text-[#2C241B]">
                    <Link href={`/database/${s.profile.studentId}`} className="hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-3 px-6 text-[#6B5E4C] font-mono">{s.profile.studentId}</td>
                  <td className="py-3 px-6 text-[#6B5E4C]">
                    {s.profile.cohorts.length > 0 ? s.profile.cohorts.map(c => c.name).join(", ") : "—"}
                  </td>
                  <td className="py-3 px-6">
                    <input 
                      type="number"
                      step="0.5"
                      min="0"
                      max={maxMarks}
                      placeholder={`/ ${maxMarks}`}
                      value={marks[pid] ?? ""}
                      onChange={e => setMarks({...marks, [pid]: e.target.value})}
                      className="w-32 border border-stone-400 text-stone-900 font-medium rounded px-3 py-1.5 focus:outline-none focus:border-[#2D4A22]"
                    />
                  </td>
                </tr>
              );
            })}
            
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#8B7D6B] italic">
                  No students found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer Action */}
      <div className="p-6 bg-[#FAF8F3] border-t border-[#E1D8C9] flex justify-end">
        <button 
          onClick={handleSaveAll}
          disabled={saving || !subject.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2D4A22] text-white font-semibold rounded hover:bg-[#1f3418] disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save All Marks"}
        </button>
      </div>
    </div>
  );
}
