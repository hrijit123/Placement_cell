"use client";

import { useState } from "react";

export default function AttendanceClient({ initialStudents }: { initialStudents: any[] }) {
  const [students, setStudents] = useState(initialStudents);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventDesc, setEventDesc] = useState("");
  const [search, setSearch] = useState("");

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase();
    const nameMatch = s.name?.toLowerCase().includes(q);
    const idMatch = s.profile?.studentId?.toLowerCase().includes(q);
    return nameMatch || idMatch;
  });

  const markAttendance = async (userId: string, status: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date: selectedDate, status, classOrEvent: eventDesc })
      });
      if (res.ok) {
        const newRecord = await res.json();
        setStudents(prev => prev.map(s => {
          if (s.id === userId) {
            return { ...s, attendance: [newRecord, ...s.attendance] };
          }
          return s;
        }));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Date</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-[#E1D8C9] p-2 rounded w-48"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Class or Event (Optional)</label>
          <input 
            type="text" 
            placeholder="e.g. Resume Building Workshop"
            value={eventDesc} 
            onChange={(e) => setEventDesc(e.target.value)}
            className="border border-[#E1D8C9] p-2 rounded w-full"
          />
        </div>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search by student name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#E1D8C9] p-2 rounded w-full max-w-md focus:outline-none focus:ring-2 focus:ring-[#2D4A22]"
        />
      </div>

      <table className="w-full text-left text-sm text-[#3E362E]">
        <thead className="bg-[#FAF8F3] text-[#6B5E4C] uppercase text-xs">
          <tr>
            <th className="p-3">Student Name</th>
            <th className="p-3">Student ID</th>
            <th className="p-3">Recent Records</th>
            <th className="p-3">Action for Selected Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-6 text-center text-gray-500">
                No students match your search.
              </td>
            </tr>
          ) : (
            filteredStudents.map((student) => {
              const hasMarkedToday = student.attendance.some(
                (a: any) => new Date(a.date).toISOString().split("T")[0] === selectedDate
              );
              return (
                <tr key={student.id} className="border-b border-[#E1D8C9]">
                  <td className="p-3 font-semibold">{student.name || "Unknown"}</td>
                  <td className="p-3 font-mono">{student.profile?.studentId || "N/A"}</td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {student.attendance.slice(0, 3).map((a: any) => (
                        <span key={a.id} className={`text-[10px] px-2 py-1 rounded ${a.status === 'PRESENT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {new Date(a.date).toLocaleDateString()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 flex gap-2">
                    {hasMarkedToday ? (
                      <span className="text-gray-500 italic">Marked</span>
                    ) : (
                      <>
                        <button 
                          onClick={() => markAttendance(student.id, "PRESENT")}
                          disabled={loading}
                          className="bg-[#2D4A22] text-white px-3 py-1 rounded hover:bg-[#1f3418]"
                        >
                          Present
                        </button>
                        <button 
                          onClick={() => markAttendance(student.id, "ABSENT")}
                          disabled={loading}
                          className="bg-red-700 text-white px-3 py-1 rounded hover:bg-red-800"
                        >
                          Absent
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
