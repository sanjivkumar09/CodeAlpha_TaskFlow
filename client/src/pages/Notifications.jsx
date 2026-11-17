import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  Calendar,
  MessageSquare,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { notificationApi } from '../services/api';
import { useSocket } from '../context/SocketContext';

const Notifications = () => {
  const { onOpenTask } = useOutletContext();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getAll();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Real-time update
  useEffect(() => {
    if (!socket) return;
    const handleNew = () => loadNotifications();
    socket.on('notification:new', handleNew);
    return () => socket.off('notification:new', handleNew);
  }, [socket]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.isRead : true));

  const getIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <CheckCircle2 className="w-4 h-4 text-brand-400" />;
      case 'status_changed':
        return <FolderKanban className="w-4 h-4 text-blue-400" />;
      case 'new_comment':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'deadline_warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time feed of task assignments, mentions, status shifts and collaboration activities.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 text-xs font-medium transition self-start sm:self-auto border border-brand-500/20"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'all'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filter === 'unread'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 space-y-2">
            <Bell className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-medium text-slate-300">Nothing new here</p>
            <p>You have caught up with all activity notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filtered.map((notif) => (
              <div
                key={notif._id}
                onClick={() => {
                  if (!notif.isRead) handleMarkOneRead(notif._id);
                  if (notif.relatedTask?._id) onOpenTask?.(notif.relatedTask._id);
                }}
                className={`p-4 flex items-start justify-between gap-4 cursor-pointer transition ${
                  !notif.isRead
                    ? 'bg-brand-500/5 hover:bg-brand-500/10'
                    : 'hover:bg-slate-800/40 text-slate-400'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  <div className="min-w-0">
                    <p className={`text-xs sm:text-sm text-slate-200 leading-snug ${!notif.isRead ? 'font-semibold' : ''}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      {notif.sender?.name && <span>From: {notif.sender.name}</span>}
                      {notif.relatedProject?.name && (
                        <>
                          <span>•</span>
                          <span>Project: {notif.relatedProject.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkOneRead(notif._id);
                    }}
                    title="Mark as read"
                    className="p-1 rounded text-slate-400 hover:text-white shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
