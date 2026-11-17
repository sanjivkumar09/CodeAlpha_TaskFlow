import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderKanban, CheckSquare, ArrowRight } from 'lucide-react';
import { taskApi } from '../services/api';
import { useProject } from '../context/ProjectContext';

const GlobalSearchModal = ({ isOpen, onClose, onSelectTask }) => {
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const { projects, selectProject } = useProject();
  const navigate = useNavigate();

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else window.dispatchEvent(new CustomEvent('open-taskflow-search'));
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search tasks when query changes
  useEffect(() => {
    if (!query.trim()) {
      setTasks([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await taskApi.getAll({ search: query.trim() });
        setTasks(res.data.tasks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  // Filter projects by query
  const matchedProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#0e1526] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks by title, description or tags, or find projects..."
            className="w-full py-4 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Projects results */}
          {matchedProjects.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Projects</p>
              <div className="space-y-1">
                {matchedProjects.map((proj) => (
                  <button
                    key={proj._id}
                    onClick={() => {
                      selectProject(proj._id);
                      navigate(`/board?project=${proj._id}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 text-left transition group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
                      <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                        {proj.name}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks results */}
          {tasks.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tasks ({tasks.length})
              </p>
              <div className="space-y-1">
                {tasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => {
                      onSelectTask?.(task._id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 text-left transition group"
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <CheckSquare className="w-4 h-4 text-brand-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                          {task.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {task.project?.name} • {task.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 ml-2">
                      {task.priority}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && !loading && tasks.length === 0 && matchedProjects.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No results found for "<span className="text-slate-300 font-medium">{query}</span>"
            </div>
          )}

          {!query && (
            <div className="p-6 text-center text-xs text-slate-400">
              Type to instantly search across all projects, tasks and team members.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
