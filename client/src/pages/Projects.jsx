import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  MoreVertical,
  Trash2,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import { projectApi } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const { projects, selectProject, refreshProjects } = useProject();
  const { user } = useAuth();
  const { onOpenCreate } = useOutletContext();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project? All associated tasks will be removed.')) {
      try {
        await projectApi.delete(projectId);
        await refreshProjects();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete project');
      }
    }
  };

  const statusStyles = {
    planning: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    on_hold: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    completed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Project Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your team's initiatives, track deliverables and milestone completion.
          </p>
        </div>

        <button
          onClick={() => onOpenCreate?.('project')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and View Toggle Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c1220] p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-brand-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded text-xs transition ${
              viewMode === 'grid' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded text-xs transition ${
              viewMode === 'table' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Table view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const progress = project.stats?.progress || 0;
            const isOwner = project.owner?._id === user?._id || user?.role === 'admin';

            return (
              <div
                key={project._id}
                onClick={() => {
                  selectProject(project._id);
                  navigate(`/board?project=${project._id}`);
                }}
                className="p-5 rounded-2xl bg-[#0c1220] hover:bg-[#0f172a] border border-slate-800/80 hover:border-slate-700 cursor-pointer shadow-sm transition-all duration-150 flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Status badge & options */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: project.color || '#3b82f6' }}
                      />
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          statusStyles[project.status] || statusStyles.active
                        }`}
                      >
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>

                    {isOwner && (
                      <button
                        onClick={(e) => handleDelete(e, project._id)}
                        title="Delete project"
                        className="p-1 text-slate-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Project Title & Description */}
                  <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                {/* Bottom Section: Progress bar & Members stack */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                  {/* Completion percentage */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-white font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: project.color || '#3b82f6',
                        }}
                      />
                    </div>
                  </div>

                  {/* Task counts & Members stack */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-slate-400">
                      <strong className="text-slate-200">{project.stats?.completedTasks || 0}</strong> /{' '}
                      {project.stats?.totalTasks || 0} tasks done
                    </span>

                    {/* Members Avatars Stack */}
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {(project.members || []).slice(0, 4).map((m, idx) => (
                        <img
                          key={idx}
                          src={m.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user?.name || idx}`}
                          alt={m.user?.name}
                          title={m.user?.name}
                          className="w-5 h-5 rounded-full object-cover border border-slate-800 bg-slate-700"
                        />
                      ))}
                      {(project.members || []).length > 4 && (
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[9px] font-semibold flex items-center justify-center text-slate-400 border border-slate-700">
                          +{project.members.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#0c1220] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Tasks</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProjects.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => {
                      selectProject(p._id);
                      navigate(`/board?project=${p._id}`);
                    }}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <div>
                          <p className="font-semibold text-white">{p.name}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-xs">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          statusStyles[p.status] || statusStyles.active
                        }`}
                      >
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="w-28 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${p.stats?.progress || 0}%`, backgroundColor: p.color || '#3b82f6' }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-300 font-medium">{p.stats?.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {p.stats?.completedTasks || 0} / {p.stats?.totalTasks || 0}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'No date'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => handleDelete(e, p._id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
