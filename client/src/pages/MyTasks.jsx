import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  CheckSquare,
  Calendar,
  AlertCircle,
  Clock,
  Filter,
  CheckCircle2,
  Circle,
  FolderKanban,
} from 'lucide-react';
import { taskApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyTasks = () => {
  const { user } = useAuth();
  const { onOpenTask } = useOutletContext();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [groupBy, setGroupBy] = useState('status'); // 'status' | 'project'

  const loadMyTasks = async () => {
    try {
      setLoading(true);
      const res = await taskApi.getAll({ assignedTo: 'me' });
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Failed to load my tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyTasks();
    const handleDataChange = () => loadMyTasks();
    window.addEventListener('taskflow-data-changed', handleDataChange);
    return () => window.removeEventListener('taskflow-data-changed', handleDataChange);
  }, []);

  const handleToggleDone = async (e, task) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await taskApi.update(task._id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = tasks.filter((t) => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchStatus && matchPriority;
  });

  const priorityStyles = {
    urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    medium: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            My Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tasks assigned directly to you across all project workspaces ({filtered.length} total).
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-[#0c1220] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CheckSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-medium text-slate-300">You're all clear!</p>
            <p>No tasks currently assigned to you match these filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filtered.map((task) => {
              const isOverdue =
                task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
              const isDone = task.status === 'done';

              return (
                <div
                  key={task._id}
                  onClick={() => onOpenTask?.(task._id)}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Done check circle */}
                    <button
                      onClick={(e) => handleToggleDone(e, task)}
                      className={`p-1 rounded-full transition ${
                        isDone
                          ? 'text-emerald-400 hover:text-slate-400'
                          : 'text-slate-500 hover:text-emerald-400'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isDone ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: task.project?.color || '#3b82f6' }}
                        />
                        <span>{task.project?.name}</span>
                        <span>•</span>
                        <span className="capitalize">{task.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Due Date & Priority */}
                  <div className="flex items-center gap-3 shrink-0">
                    {task.dueDate && (
                      <span
                        className={`text-[11px] flex items-center gap-1 ${
                          isOverdue ? 'text-red-400 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {isOverdue && <AlertCircle className="w-3 h-3" />}
                        {new Date(task.dueDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}

                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        priorityStyles[task.priority] || priorityStyles.medium
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
