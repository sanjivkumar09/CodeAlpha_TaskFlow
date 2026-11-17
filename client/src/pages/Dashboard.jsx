import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  Activity,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { onOpenTask, onOpenCreate } = useOutletContext();
  const { socket } = useSocket();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await dashboardApi.getStats();
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const handleDataChange = () => fetchStats();
    window.addEventListener('taskflow-data-changed', handleDataChange);
    return () => window.removeEventListener('taskflow-data-changed', handleDataChange);
  }, []);

  // Real-time refresh when tasks are modified or moved
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchStats();
    socket.on('task:created', handleUpdate);
    socket.on('task:moved', handleUpdate);
    socket.on('task:updated', handleUpdate);
    socket.on('task:deleted', handleUpdate);

    return () => {
      socket.off('task:created', handleUpdate);
      socket.off('task:moved', handleUpdate);
      socket.off('task:updated', handleUpdate);
      socket.off('task:deleted', handleUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800/60 rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-xl border border-slate-800"></div>
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    tasksAssignedToMe: 0,
  };

  const statCards = [
    {
      title: 'Total Projects',
      value: metrics.totalProjects,
      icon: FolderKanban,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      link: '/projects',
    },
    {
      title: 'Active Projects',
      value: metrics.activeProjects,
      icon: Flame,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
      border: 'border-brand-500/20',
      link: '/projects',
    },
    {
      title: 'Completed Tasks',
      value: metrics.completedTasks,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      link: '/board',
    },
    {
      title: 'Pending Tasks',
      value: metrics.pendingTasks,
      icon: Clock,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      link: '/board',
    },
    {
      title: 'Overdue Tasks',
      value: metrics.overdueTasks,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      badge: metrics.overdueTasks > 0 ? 'Action needed' : null,
      link: '/calendar',
    },
    {
      title: 'Assigned to Me',
      value: metrics.tasksAssignedToMe,
      icon: UserCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      link: '/my-tasks',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here's what's happening across your projects and workspace today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenCreate?.('project')}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition"
          >
            New Project
          </button>
          <button
            onClick={() => onOpenCreate?.('task')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              to={card.link}
              className={`p-4 rounded-xl bg-[#0c1220] border ${card.border} hover:border-slate-600 transition flex flex-col justify-between group shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white tracking-tight">{card.value}</span>
                {card.badge && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    {card.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Completion Progress Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0c1220] border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Project Progress Velocity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Task completion metrics by project</p>
            </div>
            <Link to="/projects" className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.projectProgress || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(val) => (val.length > 15 ? val.slice(0, 15) + '...' : val)}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="bg-[#0e1526] border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-white">{p.name}</p>
                          <p className="text-emerald-400">Completed: {p.completedTasks} tasks</p>
                          <p className="text-slate-400">Total: {p.totalTasks} tasks ({p.progress}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalTasks" fill="#1e293b" radius={[4, 4, 0, 0]} name="Total Tasks" />
                <Bar dataKey="completedTasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Completed Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by Status Distribution Pie Chart */}
        <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Task Status Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Current workflow breakdown</p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.tasksByStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(data?.tasksByStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div className="bg-[#0e1526] border border-slate-800 p-2 rounded-lg text-xs">
                          <span className="font-semibold text-white">{item.name}:</span> {item.value} tasks
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
            {(data?.tasksByStatus || []).map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-400 truncate">{s.name}:</span>
                <span className="text-white font-semibold ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Upcoming Deadlines & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines Widget */}
        <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-semibold text-white">Upcoming Deadlines</h3>
            </div>
            <Link to="/calendar" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              View Calendar
            </Link>
          </div>

          <div className="space-y-2.5">
            {(!data?.upcomingDeadlines || data.upcomingDeadlines.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No upcoming deadlines within the next 14 days.</p>
            ) : (
              data.upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  onClick={() => onOpenTask?.(task._id)}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/70 border border-slate-800/80 flex items-center justify-between cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3 truncate min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: task.project?.color || '#3b82f6' }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{task.project?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                      {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Recent Activity Stream</h3>
            </div>
            <Link to="/notifications" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              All Activity
            </Link>
          </div>

          <div className="space-y-3">
            {(!data?.recentActivity || data.recentActivity.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity recorded yet.</p>
            ) : (
              data.recentActivity.slice(0, 5).map((act) => (
                <div key={act._id} className="flex items-start gap-3 text-xs">
                  <img
                    src={act.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.sender?.name || 'User'}`}
                    alt={act.sender?.name}
                    className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 leading-snug">
                      <span className="font-semibold text-white">{act.sender?.name || 'System'}: </span>
                      {act.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(act.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
