"use client";

import { useState, useMemo } from "react";

export default function AttendanceClient({ initialStudents }: { initialStudents: any[] }) {
  const [students, setStudents] = useState(initialStudents);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventDesc, setEventDesc] = useState("");
  const [search, setSearch] = useState("");
  const [leaveNotes, setLeaveNotes] = useState<{ [key: string]: string }>({});
  const [activeLeaveInput, setActiveLeaveInput] = useState<string | null>(null);

  const filteredStudents = students.filter(s => {
    const q = search.toLowerCase();
    const nameMatch = s.name?.toLowerCase().includes(q);
    const idMatch = s.profile?.studentId?.toLowerCase().includes(q);
    return nameMatch || idMatch;
  });

  const markAttendance = async (userId: string, status: string) => {
    setLoading(true);
    const notes = status === "LEAVE" ? leaveNotes[userId] : undefined;
    
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date: selectedDate, status, classOrEvent: eventDesc, notes })
      });
      if (res.ok) {
        const newRecord = await res.json();
        setStudents(prev => prev.map(s => {
          if (s.id === userId) {
            return { ...s, attendance: [newRecord, ...s.attendance] };
          }
          return s;
        }));
        setActiveLeaveInput(null);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const analytics = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    
    students.forEach(s => {
      const todayRecord = s.attendance.find((a: any) => new Date(a.date).toISOString().split("T")[0] === selectedDate);
      if (todayRecord) {
        if (todayRecord.status === "PRESENT") present++;
        else if (todayRecord.status === "ABSENT") absent++;
        else if (todayRecord.status === "LEAVE") leave++;
      }
    });

    const total = present + absent + leave;
    return {
      present, absent, leave, total,
      presentPct: total ? ((present / total) * 100).toFixed(1) : "0.0",
      absentPct: total ? ((absent / total) * 100).toFixed(1) : "0.0",
      leavePct: total ? ((leave / total) * 100).toFixed(1) : "0.0"
    };
  }, [students, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow-sm border border-[#E1D8C9] flex flex-col items-center">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Total Marked</span>
          <span className="text-2xl font-bold text-stone-800">{analytics.total}</span>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border border-[#E1D8C9] flex flex-col items-center">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Present</span>
          <span className="text-2xl font-bold text-green-800">{analytics.presentPct}% <span className="text-sm font-normal text-stone-500">({analytics.present})</span></span>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border border-[#E1D8C9] flex flex-col items-center">
          <span className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Absent</span>
          <span className="text-2xl font-bold text-red-800">{analytics.absentPct}% <span className="text-sm font-normal text-stone-500">({analytics.absent})</span></span>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border border-[#E1D8C9] flex flex-col items-center">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Leave</span>
          <span className="text-2xl font-bold text-amber-600">{analytics.leavePct}% <span className="text-sm font-normal text-stone-500">({analytics.leave})</span></span>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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
          <div className="flex-1">
            <label className="block text-sm font-semibold text-[#6B5E4C] mb-1">Search Students</label>
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-[#E1D8C9] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#2D4A22]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#3E362E] min-w-max">
            <thead className="bg-[#FAF8F3] text-[#6B5E4C] uppercase text-xs">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Student ID</th>
                <th className="p-3 w-48">Recent Records</th>
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
                  const hasMarkedToday = student.attendance.find(
                    (a: any) => new Date(a.date).toISOString().split("T")[0] === selectedDate
                  );
                  return (
                    <tr key={student.id} className="border-b border-[#E1D8C9]">
                      <td className="p-3 font-semibold">{student.name || "Unknown"}</td>
                      <td className="p-3 font-mono">{student.profile?.studentId || "N/A"}</td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          {student.attendance.slice(0, 3).map((a: any) => (
                            <span key={a.id} className={`text-[10px] px-2 py-1 rounded ${a.status === 'PRESENT' ? 'bg-green-100 text-green-800' : a.status === 'LEAVE' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`} title={a.notes}>
                              {new Date(a.date).toLocaleDateString()} {a.status.substring(0,1)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        {hasMarkedToday ? (
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${hasMarkedToday.status === 'PRESENT' ? 'bg-green-100 text-green-800' : hasMarkedToday.status === 'LEAVE' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                            {hasMarkedToday.status} {hasMarkedToday.notes && `(${hasMarkedToday.notes})`}
                          </span>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
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
                              <button 
                                onClick={() => setActiveLeaveInput(activeLeaveInput === student.id ? null : student.id)}
                                disabled={loading}
                                className="bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600"
                              >
                                Leave
                              </button>
                            </div>
                            {activeLeaveInput === student.id && (
                              <div className="flex gap-2 items-center mt-1">
                                <input 
                                  type="text" 
                                  placeholder="Leave reason..." 
                                  value={leaveNotes[student.id] || ""}
                                  onChange={e => setLeaveNotes({...leaveNotes, [student.id]: e.target.value})}
                                  className="border text-xs p-1 rounded"
                                />
                                <button 
                                  onClick={() => markAttendance(student.id, "LEAVE")}
                                  disabled={loading}
                                  className="text-xs bg-stone-800 text-white px-2 py-1 rounded"
                                >
                                  Save Leave
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
