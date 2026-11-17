import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  User,
  Flag,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  MessageSquare,
  Tag,
  FolderKanban,
  Edit3,
} from 'lucide-react';
import { taskApi, userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const TaskDetailModal = ({ taskId, isOpen, onClose, onTaskUpdated, onTaskDeleted }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [teamUsers, setTeamUsers] = useState([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState('');

  const commentsEndRef = useRef(null);

  // Fetch task and comments
  const loadTaskData = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const [taskRes, commentsRes] = await Promise.all([
        taskApi.getById(taskId),
        taskApi.getComments(taskId),
      ]);
      setTask(taskRes.data.task);
      setTitleText(taskRes.data.task.title);
      setDescText(taskRes.data.task.description || '');
      setComments(commentsRes.data.comments || []);
    } catch (err) {
      console.error('Failed to load task details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      loadTaskData();
      userApi.search('').then((res) => setTeamUsers(res.data.users || []));
    }
  }, [isOpen, taskId]);

  // Listen for real-time comments on this task
  useEffect(() => {
    if (!socket || !taskId) return;

    const handleCommentAdded = (payload) => {
      if (payload.taskId === taskId) {
        setComments((prev) => {
          // Avoid duplicate comments
          if (prev.some((c) => c._id === payload.comment._id)) return prev;
          return [...prev, payload.comment];
        });
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    const handleTaskUpdated = (updated) => {
      if (updated._id === taskId) {
        setTask(updated);
      }
    };

    socket.on('comment:added', handleCommentAdded);
    socket.on('task:updated', handleTaskUpdated);

    return () => {
      socket.off('comment:added', handleCommentAdded);
      socket.off('task:updated', handleTaskUpdated);
    };
  }, [socket, taskId]);

  if (!isOpen) return null;

  const handleUpdateField = async (fields) => {
    try {
      const res = await taskApi.update(taskId, fields);
      setTask(res.data.task);
      onTaskUpdated?.(res.data.task);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleSaveTitle = () => {
    if (titleText.trim() && titleText !== task?.title) {
      handleUpdateField({ title: titleText.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (descText !== task?.description) {
      handleUpdateField({ description: descText.trim() });
    }
    setIsEditingDesc(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const res = await taskApi.addComment(taskId, { content: newComment.trim() });
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      try {
        await taskApi.delete(taskId);
        onTaskDeleted?.(taskId);
        onClose();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const priorityColors = {
    urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    medium: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0c1220] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: task?.project?.color || '#3b82f6' }}
            />
            <span className="font-medium text-slate-300">{task?.project?.name}</span>
            <span>/</span>
            <span className="font-mono text-slate-400">TASK-{task?._id?.slice(-4).toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              title="Delete task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading task details...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* Left 2 Cols: Main Info, Description, Comments */}
            <div className="md:col-span-2 p-6 space-y-6">
              {/* Title Section */}
              <div>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={titleText}
                      onChange={(e) => setTitleText(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                      autoFocus
                      className="w-full text-lg font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg border border-brand-500 outline-none"
                    />
                  </div>
                ) : (
                  <h2
                    onClick={() => setIsEditingTitle(true)}
                    className="text-lg sm:text-xl font-bold text-white hover:text-brand-300 cursor-pointer group flex items-start gap-2"
                  >
                    <span>{task?.title}</span>
                    <Edit3 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition mt-1" />
                  </h2>
                )}
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Description</span>
                  {!isEditingDesc && (
                    <button
                      onClick={() => setIsEditingDesc(true)}
                      className="text-brand-400 hover:text-brand-300 lowercase text-xs font-normal"
                    >
                      edit
                    </button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      value={descText}
                      onChange={(e) => setDescText(e.target.value)}
                      rows={4}
                      autoFocus
                      className="w-full text-xs text-slate-200 bg-slate-900 p-3 rounded-lg border border-brand-500 outline-none resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingDesc(false)}
                        className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDescription}
                        className="px-3 py-1 rounded bg-brand-600 text-white text-xs font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed cursor-pointer p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/90 border border-slate-800/80 transition min-h-[60px]"
                  >
                    {task?.description || 'No description provided. Click to add details.'}
                  </p>
                )}
              </div>

              {/* Labels */}
              {task?.labels && task.labels.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels.map((lbl, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                      >
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments & Activity Feed */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Comments & Activity ({comments.length})</span>
                </div>

                {/* Comment list */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation!</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c._id} className="flex gap-2.5 text-xs group">
                        <img
                          src={c.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user?.name || 'User'}`}
                          alt={c.user?.name}
                          className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-slate-700"
                        />
                        <div className="flex-1 bg-slate-900/80 rounded-xl p-3 border border-slate-800/80">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white">{c.user?.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.createdAt).toLocaleDateString()} at{' '}
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-200 whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Comment input form */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment or update..."
                    className="flex-1 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-brand-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Col: Metadata Properties Sidebar */}
            <div className="p-6 space-y-5 bg-[#090d16]/50">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Properties</h3>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Status</label>
                <select
                  value={task?.status || 'todo'}
                  onChange={(e) => handleUpdateField({ status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium outline-none focus:border-brand-500 capitalize"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Priority</label>
                <select
                  value={task?.priority || 'medium'}
                  onChange={(e) => handleUpdateField({ priority: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium outline-none focus:border-brand-500 capitalize"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Assignee Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Assignee</label>
                <select
                  value={task?.assignedTo?._id || ''}
                  onChange={(e) => handleUpdateField({ assignedTo: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium outline-none focus:border-brand-500"
                >
                  <option value="">Unassigned</option>
                  {teamUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Due Date</label>
                <input
                  type="date"
                  value={task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdateField({ dueDate: e.target.value ? new Date(e.target.value) : null })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium outline-none focus:border-brand-500"
                />
              </div>

              {/* Created Info */}
              <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Created By:</span>
                  <span className="text-slate-300">{task?.createdBy?.name || 'Admin'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created On:</span>
                  <span className="text-slate-300">
                    {task?.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;
