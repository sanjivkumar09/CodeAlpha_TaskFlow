import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Kanban,
  Users,
  Calendar,
  Bell,
  Settings,
  Plus,
  ChevronRight,
  LogOut,
  Folder,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';

const Sidebar = ({ isOpen, onClose, onOpenCreateModal }) => {
  const { user, logout } = useAuth();
  const { projects, selectedProjectId, selectProject } = useProject();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/my-tasks', icon: CheckSquare },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Kanban Board', path: '/board', icon: Kanban },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0c1220] border-r border-[#1e293b] flex flex-col z-50 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">TaskFlow</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  v2.0
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Enterprise SaaS</span>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 transition-colors group-hover:text-brand-400" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Projects Quick Switcher Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Projects ({projects.length})
              </span>
              <button
                onClick={() => {
                  onClose?.();
                  onOpenCreateModal?.('project');
                }}
                title="Create Project"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {projects.map((proj) => {
                const isSelected = selectedProjectId === proj._id;
                return (
                  <button
                    key={proj._id}
                    onClick={() => {
                      selectProject(proj._id);
                      navigate(`/board?project=${proj._id}`);
                      onClose?.();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition text-left group ${
                      isSelected
                        ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || '#3b82f6' }}
                      />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#1e293b] bg-[#090d16]/70">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                alt={user?.name}
                className="w-8 h-8 rounded-full bg-slate-700 object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate capitalize">
                  {user?.role === 'admin' ? 'Lead Admin' : 'Member'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
