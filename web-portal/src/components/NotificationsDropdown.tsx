"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error("Error fetching notifications", err);
      }
    };
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // mark all as read
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true })
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-stone-200 transition-colors"
      >
        <Bell className="w-5 h-5 text-stone-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 shadow-xl rounded-xl overflow-hidden z-50">
          <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 font-semibold text-stone-800">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-stone-500 text-sm">No notifications</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`p-4 border-b border-stone-100 last:border-0 ${!n.isRead ? 'bg-emerald-50/50' : ''}`}>
                  <p className="text-sm text-stone-800">{n.message}</p>
                  <p className="text-xs text-stone-400 mt-1">{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
