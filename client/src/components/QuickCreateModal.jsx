import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, User, Tag, Flag, Layers } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { taskApi, projectApi, userApi } from '../services/api';

const PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

const QuickCreateModal = ({ isOpen, onClose, initialType = 'task', defaultProjectId = null, onCreated }) => {
  const { projects, selectedProjectId, refreshProjects } = useProject();
  const [activeTab, setActiveTab] = useState(initialType); // 'task' | 'project'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);

  // Task form state
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    project: defaultProjectId || selectedProjectId || (projects[0]?._id || ''),
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    labels: '',
  });

  // Project form state
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    status: 'active',
    color: '#3b82f6',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  });

  useEffect(() => {
    setActiveTab(initialType);
    if (defaultProjectId) {
      setTaskData((prev) => ({ ...prev, project: defaultProjectId }));
    } else if (selectedProjectId) {
      setTaskData((prev) => ({ ...prev, project: selectedProjectId }));
    }
  }, [initialType, defaultProjectId, selectedProjectId, isOpen]);

  // Load registered users for assignee dropdown
  useEffect(() => {
    if (isOpen) {
      userApi
        .search('')
        .then((res) => setUsers(res.data.users || []))
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskData.title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!taskData.project) {
      setError('Please select a project');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        ...taskData,
        labels: taskData.labels
          ? taskData.labels.split(',').map((l) => l.trim()).filter(Boolean)
          : [],
        assignedTo: taskData.assignedTo || null,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      };

      const res = await taskApi.create(payload);
      onCreated?.(res.data.task);
      onClose();
      // Reset form
      setTaskData({
        title: '',
        description: '',
        project: selectedProjectId || projects[0]?._id || '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
        assignedTo: '',
        labels: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await projectApi.create({
        ...projectData,
        dueDate: projectData.dueDate ? new Date(projectData.dueDate) : null,
      });
      await refreshProjects();
      onCreated?.(res.data.project);
      onClose();
      setProjectData({
        name: '',
        description: '',
        status: 'active',
        color: '#3b82f6',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-[#0e1526] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-800">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('task');
                setError('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'task'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Task
            </button>
            <button
              onClick={() => {
                setActiveTab('project');
                setError('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'project'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Project
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Task Form */}
        {activeTab === 'task' ? (
          <form onSubmit={handleCreateTask} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Task Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                placeholder="e.g. Design responsive navbar component"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                rows={3}
                placeholder="Add context, acceptance criteria or links..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project <span className="text-red-400">*</span>
                </label>
                <select
                  value={taskData.project}
                  onChange={(e) => setTaskData({ ...taskData, project: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assignee</label>
                <select
                  value={taskData.assignedTo}
                  onChange={(e) => setTaskData({ ...taskData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={taskData.status}
                  onChange={(e) => setTaskData({ ...taskData, status: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                <select
                  value={taskData.priority}
                  onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskData.dueDate}
                  onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Labels <span className="text-slate-400 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={taskData.labels}
                onChange={(e) => setTaskData({ ...taskData, labels: e.target.value })}
                placeholder="e.g. Frontend, Auth, Bug"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        ) : (
          /* Project Form */
          <form onSubmit={handleCreateProject} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={projectData.name}
                onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                placeholder="e.g. Mobile App Redesign v2"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <textarea
                value={projectData.description}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                rows={3}
                placeholder="What is the objective and scope of this project?"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={projectData.status}
                  onChange={(e) => setProjectData({ ...projectData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={projectData.dueDate}
                  onChange={(e) => setProjectData({ ...projectData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Accent Color</label>
              <div className="flex gap-2">
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setProjectData({ ...projectData, color })}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition"
                    style={{ backgroundColor: color }}
                  >
                    {projectData.color === color && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuickCreateModal;
