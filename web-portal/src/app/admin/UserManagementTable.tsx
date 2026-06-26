"use client";

import { useState, useEffect, useCallback } from "react";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
};

export default function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${p}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  const confirmStatusChange = async () => {
    if (!selectedUser || !newStatus) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchUsers(page);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setModalOpen(false);
    }
  };

  const handleExport = () => {
    window.open("/api/admin/export", "_blank");
  };

  return (
    <section className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9] mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif text-[#2C241B]">User Management</h2>
        <button 
          onClick={handleExport}
          className="bg-[#2D4A22] text-white px-4 py-2 rounded font-semibold text-sm hover:bg-[#3d632e] transition"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-[#E1D8C9] text-[#6B5E4C]">
              <th className="py-3 px-4 font-semibold">Name / Email</th>
              <th className="py-3 px-4 font-semibold">Role</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="py-8 text-center">Loading...</td></tr>}
            {!loading && users.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-[#8B7D6B] italic">No users found.</td></tr>
            )}
            {!loading && users.map((u) => (
              <tr key={u.id} className="border-b border-[#F5F0E6] hover:bg-[#FAF8F3] transition-colors">
                <td className="py-4 px-4">
                  <div className="font-medium text-[#2C241B]">{u.name || "N/A"}</div>
                  <div className="text-xs text-[#8B7D6B]">{u.email}</div>
                </td>
                <td className="py-4 px-4 text-sm">{u.role}</td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    u.status === 'ACTIVE' ? 'bg-[#E8F0E5] text-[#2D4A22]' : 
                    u.status === 'SUSPENDED' ? 'bg-orange-100 text-orange-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-right space-x-2">
                  {u.status !== 'ACTIVE' && (
                    <button 
                      onClick={() => { setSelectedUser(u); setNewStatus("ACTIVE"); setModalOpen(true); }}
                      className="text-xs font-semibold text-[#2D4A22] hover:underline"
                    >
                      Reactivate
                    </button>
                  )}
                  {u.status === 'ACTIVE' && (
                    <button 
                      onClick={() => { setSelectedUser(u); setNewStatus("SUSPENDED"); setModalOpen(true); }}
                      className="text-xs font-semibold text-orange-600 hover:underline"
                    >
                      Suspend
                    </button>
                  )}
                  {u.status !== 'BANNED' && (
                    <button 
                      onClick={() => { setSelectedUser(u); setNewStatus("BANNED"); setModalOpen(true); }}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Ban
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <button 
          disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}
          className="px-4 py-2 border border-[#E1D8C9] rounded text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-[#8B7D6B]">Page {page} of {totalPages || 1}</span>
        <button 
          disabled={page >= totalPages}
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 border border-[#E1D8C9] rounded text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Accessible Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full border border-[#E1D8C9]" role="dialog" aria-modal="true">
            <h3 className="text-lg font-serif font-bold text-[#2C241B] mb-2">Confirm Action</h3>
            <p className="text-sm text-[#6B5E4C] mb-6">
              Are you sure you want to change the status of <strong>{selectedUser?.name || selectedUser?.email}</strong> to <strong>{newStatus}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded text-sm font-semibold border border-[#E1D8C9] text-[#6B5E4C] hover:bg-stone-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmStatusChange}
                className="px-4 py-2 rounded text-sm font-semibold bg-[#2D4A22] text-white hover:bg-[#3d632e]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
