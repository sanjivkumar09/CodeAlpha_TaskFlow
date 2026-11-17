import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Plus,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  FolderKanban,
} from 'lucide-react';
import { taskApi, userApi } from '../services/api';
import { useProject } from '../context/ProjectContext';
import { useSocket } from '../context/SocketContext';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#94a3b8', dotColor: 'bg-slate-400' },
  { id: 'in_progress', title: 'In Progress', color: '#3b82f6', dotColor: 'bg-blue-500' },
  { id: 'in_review', title: 'In Review', color: '#a855f7', dotColor: 'bg-purple-500' },
  { id: 'done', title: 'Done', color: '#10b981', dotColor: 'bg-emerald-500' },
];

const KanbanBoard = () => {
  const [searchParams] = useSearchParams();
  const { projects, selectedProjectId, selectProject } = useProject();
  const { socket, joinProject, leaveProject } = useSocket();
  const { onOpenTask, onOpenCreate } = useOutletContext();

  const projectIdFromUrl = searchParams.get('project');
  const activeProjectId = projectIdFromUrl || selectedProjectId || (projects[0]?._id || null);

  const [tasks, setTasks] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Load tasks for current project
  const loadProjectTasks = async () => {
    if (!activeProjectId) return;
    try {
      setLoading(true);
      const res = await taskApi.getAll({ project: activeProjectId });
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProjectId) {
      loadProjectTasks();
      joinProject(activeProjectId);
      userApi.search('').then((res) => setTeamUsers(res.data.users || []));

      return () => {
        leaveProject(activeProjectId);
      };
    }
  }, [activeProjectId]);

  // Listen to Socket.IO live board events
  useEffect(() => {
    if (!socket) return;

    const handleTaskMoved = (payload) => {
      setTasks((prev) => {
        const remaining = prev.filter((t) => t._id !== payload.taskId);
        return [...remaining, payload.task].sort((a, b) => a.position - b.position);
      });
    };

    const handleTaskCreated = (newTask) => {
      if (newTask.project?._id === activeProjectId || newTask.project === activeProjectId) {
        setTasks((prev) => {
          if (prev.some((t) => t._id === newTask._id)) return prev;
          return [...prev, newTask];
        });
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    socket.on('task:moved', handleTaskMoved);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
    };
  }, [socket, activeProjectId]);

  // Handle Drag & Drop finish
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // Dropped in same place
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;
    const newPosition = destination.index;

    // Optimistic state update
    const movedTask = tasks.find((t) => t._id === draggableId);
    if (!movedTask) return;

    const updatedTask = { ...movedTask, status: destStatus, position: newPosition };

    setTasks((prev) => {
      const rest = prev.filter((t) => t._id !== draggableId);
      return [...rest, updatedTask];
    });

    // Call backend API to persist to MongoDB
    try {
      await taskApi.reorder(draggableId, {
        destinationStatus: destStatus,
        newPosition,
      });
    } catch (err) {
      console.error('Failed to update task position in MongoDB:', err);
      loadProjectTasks(); // Rollback on failure
    }
  };

  // Filter tasks based on search, assignee, priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !searchQuery.trim() ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.labels && task.labels.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesAssignee =
        filterAssignee === 'all' ||
        (filterAssignee === 'unassigned' && !task.assignedTo) ||
        (task.assignedTo && task.assignedTo._id === filterAssignee);

      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

      return matchesSearch && matchesAssignee && matchesPriority;
    });
  }, [tasks, searchQuery, filterAssignee, filterPriority]);

  const currentProject = projects.find((p) => p._id === activeProjectId);

  const priorityStyles = {
    urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    medium: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-200">
      {/* Board Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentProject?.color || '#3b82f6' }}
            />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {currentProject?.name || 'Project Kanban Board'}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {currentProject?.description || 'Drag and drop cards between workflow stages. Synced in real-time.'}
          </p>
        </div>

        {/* Project Switcher + Create Task Button */}
        <div className="flex items-center gap-3">
          <select
            value={activeProjectId || ''}
            onChange={(e) => {
              selectProject(e.target.value);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium outline-none focus:border-brand-500"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => onOpenCreate?.('task')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0c1220] p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tasks by name, tag or keyword..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Assignee:</span>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-brand-500"
          >
            <option value="all">All Members</option>
            <option value="unassigned">Unassigned</option>
            {teamUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {(searchQuery || filterAssignee !== 'all' || filterPriority !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterAssignee('all');
              setFilterPriority('all');
            }}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium px-2 py-1"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Kanban Drag-and-Drop Columns Container */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 items-start overflow-x-auto pb-6">
          {COLUMNS.map((column) => {
            const columnTasks = filteredTasks
              .filter((t) => t.status === column.id)
              .sort((a, b) => a.position - b.position);

            return (
              <div
                key={column.id}
                className="bg-[#0c1220] border border-slate-800/80 rounded-2xl flex flex-col max-h-[calc(100vh-250px)] min-h-[300px] shadow-sm"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0c1220] rounded-t-2xl z-10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      {column.title}
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenCreate?.('task')}
                    title={`Add task to ${column.title}`}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Droppable Task List */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2.5 space-y-2.5 overflow-y-auto transition-colors duration-150 min-h-[150px] ${
                        snapshot.isDraggingOver ? 'bg-slate-800/30 ring-1 ring-brand-500/40 rounded-b-2xl' : ''
                      }`}
                    >
                      {columnTasks.length === 0 ? (
                        <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-center p-3">
                          <p className="text-[11px] text-slate-400">No tasks in {column.title}</p>
                          <button
                            onClick={() => onOpenCreate?.('task')}
                            className="mt-1.5 text-[11px] text-brand-400 hover:text-brand-300 font-medium"
                          >
                            + Add one
                          </button>
                        </div>
                      ) : (
                        columnTasks.map((task, index) => {
                          const isOverdue =
                            task.dueDate &&
                            new Date(task.dueDate) < new Date() &&
                            task.status !== 'done';

                          return (
                            <Draggable key={task._id} draggableId={task._id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => onOpenTask?.(task._id)}
                                  className={`p-3.5 rounded-xl bg-[#0e1526] hover:bg-[#131c33] border border-slate-800/80 hover:border-slate-700 cursor-pointer shadow-sm transition-all group ${
                                    snapshot.isDragging
                                      ? 'shadow-2xl ring-2 ring-brand-500 scale-[1.02] z-50 bg-[#16213c]'
                                      : ''
                                  }`}
                                >
                                  {/* Top row: Priority badge + Labels */}
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <span
                                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                        priorityStyles[task.priority] || priorityStyles.medium
                                      }`}
                                    >
                                      {task.priority}
                                    </span>

                                    {task.labels && task.labels.length > 0 && (
                                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                        #{task.labels[0]}
                                      </span>
                                    )}
                                  </div>

                                  {/* Task Title */}
                                  <h4 className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-brand-200 line-clamp-2 leading-snug">
                                    {task.title}
                                  </h4>

                                  {/* Bottom row: Due Date + Assignee avatar */}
                                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                      {task.dueDate ? (
                                        <div
                                          className={`flex items-center gap-1 ${
                                            isOverdue ? 'text-red-400 font-semibold' : 'text-slate-400'
                                          }`}
                                        >
                                          {isOverdue ? (
                                            <AlertCircle className="w-3 h-3" />
                                          ) : (
                                            <Calendar className="w-3 h-3" />
                                          )}
                                          <span>
                                            {new Date(task.dueDate).toLocaleDateString([], {
                                              month: 'short',
                                              day: 'numeric',
                                            })}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400">No due date</span>
                                      )}
                                    </div>

                                    {/* Assigned User Avatar */}
                                    {task.assignedTo ? (
                                      <div
                                        title={`Assigned to ${task.assignedTo.name}`}
                                        className="flex items-center gap-1"
                                      >
                                        <img
                                          src={
                                            task.assignedTo.avatar ||
                                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignedTo.name}`
                                          }
                                          alt={task.assignedTo.name}
                                          className="w-5 h-5 rounded-full object-cover border border-slate-700 bg-slate-800"
                                        />
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
