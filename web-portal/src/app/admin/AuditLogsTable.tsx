"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export default function AuditLogsTable({ logs }: { logs: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter(log => {
    const s = searchTerm.toLowerCase();
    const actorName = (log.actor?.name || log.actor?.email || "").toLowerCase();
    const studentName = (log.profile?.user?.name || log.profile?.studentId || "").toLowerCase();
    return actorName.includes(s) || studentName.includes(s) || log.action.toLowerCase().includes(s) || log.field.toLowerCase().includes(s);
  });

  return (
    <section className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9] mt-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-serif text-[#2C241B]">System Audit Logs</h2>
          <p className="text-[#6B5E4C] text-sm">Chronological record of all profile edits and access events.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded text-sm outline-none focus:border-[#2D4A22]"
          />
        </div>
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b-2 border-[#E1D8C9] text-[#6B5E4C]">
              <th className="py-3 px-4 font-semibold text-sm">Timestamp</th>
              <th className="py-3 px-4 font-semibold text-sm">Actor</th>
              <th className="py-3 px-4 font-semibold text-sm">Action</th>
              <th className="py-3 px-4 font-semibold text-sm">Target Profile</th>
              <th className="py-3 px-4 font-semibold text-sm">Field / Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#8B7D6B] italic">No logs found matching your search.</td>
              </tr>
            ) : (
              filteredLogs.map((log: any) => (
                <tr key={log.id} className="border-b border-[#F5F0E6] hover:bg-[#FAF8F3] transition-colors">
                  <td className="py-3 px-4 text-xs text-[#6B5E4C] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">
                    {log.actor?.name || log.actor?.email || 'Unknown'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'VERIFY' ? 'bg-emerald-100 text-emerald-800' :
                      log.action === 'ACCESS_OUT_OF_COHORT' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {log.profile?.user?.name || log.profile?.studentId || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#6B5E4C]">
                    {log.field}
                    {log.oldValue && log.newValue && (
                      <span className="block text-xs text-stone-400 mt-1">
                        {log.oldValue} ➔ {log.newValue}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
