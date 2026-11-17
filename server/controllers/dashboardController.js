const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// @desc    Get dashboard statistics and analytics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Determine relevant projects
    const projectFilter = req.user.role === 'admin'
      ? {}
      : {
          $or: [{ owner: userId }, { 'members.user': userId }],
        };

    const projects = await Project.find(projectFilter).populate('owner', 'name email avatar');
    const projectIds = projects.map((p) => p._id);

    // Get all tasks in those projects
    const tasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name color')
      .sort({ dueDate: 1 });

    const now = new Date();

    // Key metrics
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'done').length;
    const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length;
    const tasksAssignedToMe = tasks.filter(
      (t) => t.assignedTo && t.assignedTo._id.toString() === userId.toString()
    ).length;

    // Upcoming deadlines (next 14 days, not completed)
    const upcomingDeadlines = tasks
      .filter((t) => t.dueDate && new Date(t.dueDate) >= now && t.status !== 'done')
      .slice(0, 6);

    // Project Progress Breakdown
    const projectProgress = projects.map((p) => {
      const pTasks = tasks.filter((t) => t.project._id.toString() === p._id.toString());
      const total = pTasks.length;
      const done = pTasks.filter((t) => t.status === 'done').length;
      const inProgress = pTasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length;
      const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        id: p._id,
        name: p.name,
        color: p.color,
        status: p.status,
        totalTasks: total,
        completedTasks: done,
        inProgressTasks: inProgress,
        progress: percentage,
      };
    });

    // Tasks by status distribution
    const statusCounts = {
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      in_review: tasks.filter((t) => t.status === 'in_review').length,
      done: completedTasks,
    };

    // Tasks by priority distribution
    const priorityCounts = {
      low: tasks.filter((t) => t.priority === 'low').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      high: tasks.filter((t) => t.priority === 'high').length,
      urgent: tasks.filter((t) => t.priority === 'urgent').length,
    };

    // Recent activity (latest notifications + latest comments)
    const recentNotifications = await Notification.find({
      relatedProject: { $in: projectIds },
    })
      .populate('sender', 'name email avatar')
      .populate('relatedProject', 'name color')
      .populate('relatedTask', 'title')
      .sort({ createdAt: -1 })
      .limit(8);

    const recentComments = await Comment.find({
      task: { $in: tasks.map((t) => t._id) },
    })
      .populate('user', 'name avatar')
      .populate('task', 'title project')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        metrics: {
          totalProjects,
          activeProjects,
          completedTasks,
          pendingTasks,
          overdueTasks,
          tasksAssignedToMe,
        },
        projectProgress,
        upcomingDeadlines,
        tasksByStatus: [
          { name: 'To Do', value: statusCounts.todo, color: '#94a3b8' },
          { name: 'In Progress', value: statusCounts.in_progress, color: '#3b82f6' },
          { name: 'In Review', value: statusCounts.in_review, color: '#a855f7' },
          { name: 'Done', value: statusCounts.done, color: '#10b981' },
        ],
        tasksByPriority: [
          { name: 'Low', count: priorityCounts.low, color: '#64748b' },
          { name: 'Medium', count: priorityCounts.medium, color: '#38bdf8' },
          { name: 'High', count: priorityCounts.high, color: '#f59e0b' },
          { name: 'Urgent', count: priorityCounts.urgent, color: '#ef4444' },
        ],
        recentActivity: recentNotifications,
        recentComments,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats };
