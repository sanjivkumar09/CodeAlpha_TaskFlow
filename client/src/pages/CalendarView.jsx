import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { taskApi } from '../services/api';

const CalendarView = () => {
  const { onOpenTask } = useOutletContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await taskApi.getAll({});
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const handleDataChange = () => loadTasks();
    window.addEventListener('taskflow-data-changed', handleDataChange);
    return () => window.removeEventListener('taskflow-data-changed', handleDataChange);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Compute calendar days
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date();

  // Find overdue tasks (deadline before today, not done)
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < today && t.status !== 'done'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Month Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Workspace Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track upcoming deadlines, project milestones and scheduled deliverable dates.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0c1220] p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-white px-3 min-w-[130px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-medium text-brand-300 hover:text-white hover:bg-brand-600/30 rounded-lg transition border border-brand-500/20"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main Calendar View with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Monthly Calendar Grid (3 Cols) */}
        <div className="lg:col-span-3 bg-[#0c1220] border border-slate-800 rounded-2xl p-4 shadow-sm">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-[11px] font-semibold text-slate-400 py-1 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((dayDate, idx) => {
              if (!dayDate) {
                return <div key={`empty-${idx}`} className="h-24 sm:h-28 rounded-xl bg-slate-900/20" />;
              }

              const isToday =
                dayDate.getDate() === today.getDate() &&
                dayDate.getMonth() === today.getMonth() &&
                dayDate.getFullYear() === today.getFullYear();

              // Filter tasks on this exact date
              const dayTasks = tasks.filter((t) => {
                if (!t.dueDate) return false;
                const td = new Date(t.dueDate);
                return (
                  td.getDate() === dayDate.getDate() &&
                  td.getMonth() === dayDate.getMonth() &&
                  td.getFullYear() === dayDate.getFullYear()
                );
              });

              return (
                <div
                  key={dayDate.toISOString()}
                  className={`h-24 sm:h-28 p-2 rounded-xl border flex flex-col justify-between transition group overflow-hidden ${
                    isToday
                      ? 'bg-brand-500/10 border-brand-500/40'
                      : 'bg-[#0e1526]/80 hover:bg-[#131c33] border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Pills */}
                  <div className="space-y-1 overflow-y-auto max-h-16 pr-0.5">
                    {dayTasks.map((task) => (
                      <div
                        key={task._id}
                        onClick={() => onOpenTask?.(task._id)}
                        title={task.title}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer transition hover:opacity-90 text-left border"
                        style={{
                          backgroundColor: `${task.project?.color || '#3b82f6'}20`,
                          borderColor: `${task.project?.color || '#3b82f6'}40`,
                          color: '#e2e8f0',
                        }}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overdue & Upcoming Deadlines Sidebar (1 Col) */}
        <div className="space-y-5">
          {/* Overdue Warning Card */}
          <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Overdue Tasks ({overdueTasks.length})
              </h3>
            </div>

            {overdueTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No overdue tasks. Clean sheet!</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {overdueTasks.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => onOpenTask?.(t._id)}
                    className="p-2.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 cursor-pointer transition"
                  >
                    <p className="text-xs font-medium text-slate-200 line-clamp-1">{t.title}</p>
                    <div className="flex justify-between items-center text-[10px] text-red-400 mt-1">
                      <span>{t.project?.name}</span>
                      <span>
                        Due {new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tips Box */}
          <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <h4 className="font-semibold text-slate-300">Milestone Planning</h4>
            <p className="leading-relaxed">
              Click any task chip in the calendar cells to view details, update due dates, or post comments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
