import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Plus,
  Bell,
  Check,
  ExternalLink,
  User as UserIcon,
  LogOut,
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useSocket } from '../context/SocketContext';
import { notificationApi } from '../services/api';

const Navbar = ({ onOpenSidebar, onOpenCreateModal, onOpenSearchModal }) => {
  const { user, logout } = useAuth();
  const { projects, selectedProjectId, selectProject } = useProject();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      fetchNotifications();
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const currentProject = projects.find((p) => p._id === selectedProjectId);

  return (
    <header className="h-16 bg-[#0c1220]/80 backdrop-blur-md border-b border-[#1e293b] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left section: mobile hamburger & project indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Project Selector dropdown pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: currentProject?.color || '#8b5cf6' }}
          />
          <select
            value={selectedProjectId || ''}
            onChange={(e) => {
              selectProject(e.target.value);
              navigate(`/board?project=${e.target.value}`);
            }}
            className="bg-transparent text-slate-200 font-medium outline-none cursor-pointer text-xs"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id} className="bg-slate-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center Search trigger button */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={onOpenSearchModal}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-400 transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search tasks, projects, people...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right controls: socket status, + New button, Notifications, User menu */}
      <div className="flex items-center gap-2.5">
        {/* Real-time connection badge */}
        <div
          title={connected ? 'Real-Time Sync Active (Socket.IO)' : 'Connecting to live server...'}
          className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-[11px]"
        >
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-slate-400">{connected ? 'Live' : 'Syncing'}</span>
        </div>

        {/* Quick Create Button */}
        <button
          onClick={() => onOpenCreateModal('task')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-glow transition"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-[#0c1220]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0e1526] border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications yet. You're all caught up!
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleMarkOneRead(notif._id)}
                      className={`p-3 text-xs transition cursor-pointer flex gap-3 items-start ${
                        !notif.isRead ? 'bg-brand-500/5 hover:bg-brand-500/10' : 'hover:bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0 opacity-80" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-slate-200 leading-snug ${!notif.isRead ? 'font-medium' : ''}`}>
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-800 bg-slate-900/60 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium inline-block"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-brand-500/40 transition"
          >
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
              alt={user?.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-700 bg-slate-800"
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0e1526] border border-slate-800 rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-800">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Settings</span>
                </Link>
              </div>

              <div className="border-t border-slate-800 pt-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
