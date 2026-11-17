const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');

// @desc    Get tasks with optional query filters
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { project, assignedTo, status, priority, search } = req.query;
    const filter = {};

    if (project) {
      filter.project = project;
    } else {
      // If no specific project, ensure user only sees tasks from projects they belong to
      if (req.user.role !== 'admin') {
        const userProjects = await Project.find({
          $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
        }).select('_id');
        filter.project = { $in: userProjects.map((p) => p._id) };
      }
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo === 'me' ? req.user._id : assignedTo;
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { labels: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color status')
      .sort({ position: 1, createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color status owner members');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({
      success: true,
      task,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { title, description, project: projectId, assignedTo, status, priority, dueDate, labels } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ success: false, message: 'Title and project are required' });
    }

    // Verify project membership
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userId = req.user._id.toString();
    const isMember =
      project.owner.toString() === userId ||
      project.members.some((m) => m.user.toString() === userId) ||
      req.user.role === 'admin';

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to create tasks in this project' });
    }

    const taskStatus = status || 'todo';

    // Find highest position in target column
    const lastTask = await Task.findOne({ project: projectId, status: taskStatus })
      .sort({ position: -1 });
    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await Task.create({
      title,
      description: description || '',
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: taskStatus,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      labels: Array.isArray(labels) ? labels : [],
      position,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color status');

    // Notify assigned user if assigned to someone else
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: assignedTo,
        sender: req.user._id,
        type: 'task_assigned',
        message: `${req.user.name} assigned you a new task: "${task.title}"`,
        relatedProject: projectId,
        relatedTask: task._id,
      });

      // Socket notification to assigned user
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${assignedTo}`).emit('notification:new', {
          message: `${req.user.name} assigned you a new task: "${task.title}"`,
          relatedTask: task._id,
        });
      }
    }

    // Real-time broadcast to project room
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('task:created', populatedTask);
    }

    res.status(201).json({
      success: true,
      task: populatedTask,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      labels,
      position,
    } = req.body;

    const previousStatus = task.status;
    const previousAssignee = task.assignedTo ? task.assignedTo.toString() : null;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (labels !== undefined) task.labels = labels;
    if (position !== undefined) task.position = position;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color status');

    const io = req.app.get('io');

    // Notify on status change
    if (status && status !== previousStatus && task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: task.assignedTo,
        sender: req.user._id,
        type: 'status_changed',
        message: `${req.user.name} moved "${task.title}" to ${status.replace('_', ' ').toUpperCase()}`,
        relatedProject: task.project,
        relatedTask: task._id,
      });

      if (io) {
        io.to(`user:${task.assignedTo}`).emit('notification:new', {
          message: `Task "${task.title}" moved to ${status}`,
        });
      }
    }

    // Notify on new assignment
    if (assignedTo && assignedTo.toString() !== previousAssignee && assignedTo.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: assignedTo,
        sender: req.user._id,
        type: 'task_assigned',
        message: `${req.user.name} assigned you the task: "${task.title}"`,
        relatedProject: task.project,
        relatedTask: task._id,
      });

      if (io) {
        io.to(`user:${assignedTo}`).emit('notification:new', {
          message: `${req.user.name} assigned you: "${task.title}"`,
        });
      }
    }

    // Emit live update to project room
    if (io) {
      io.to(`project:${task.project}`).emit('task:updated', updatedTask);
    }

    res.json({
      success: true,
      task: updatedTask,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reorder / Move task for Kanban board drag & drop
// @route   PUT /api/tasks/:id/reorder
// @access  Private
const reorderTask = async (req, res, next) => {
  try {
    const { destinationStatus, newPosition } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const oldStatus = task.status;
    const targetStatus = destinationStatus || oldStatus;
    const targetPos = typeof newPosition === 'number' ? newPosition : 0;

    // Shift other tasks in target column to make room
    if (targetStatus === oldStatus) {
      // Reordering within the same column
      await Task.updateMany(
        {
          project: task.project,
          status: targetStatus,
          _id: { $ne: task._id },
          position: { $gte: targetPos },
        },
        { $inc: { position: 1 } }
      );
    } else {
      // Moving across columns
      await Task.updateMany(
        {
          project: task.project,
          status: oldStatus,
          position: { $gt: task.position },
        },
        { $inc: { position: -1 } }
      );

      await Task.updateMany(
        {
          project: task.project,
          status: targetStatus,
          position: { $gte: targetPos },
        },
        { $inc: { position: 1 } }
      );
    }

    task.status = targetStatus;
    task.position = targetPos;
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color status');

    // Notify project room
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${task.project}`).emit('task:moved', {
        taskId: task._id,
        task: populatedTask,
        sourceStatus: oldStatus,
        destinationStatus: targetStatus,
        newPosition: targetPos,
      });
    }

    res.json({
      success: true,
      task: populatedTask,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const projectId = task.project;

    await Comment.deleteMany({ task: task._id });
    await Notification.deleteMany({ relatedTask: task._id });
    await task.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('task:deleted', { taskId: req.params.id, projectId });
    }

    res.json({
      success: true,
      message: 'Task removed successfully',
      taskId: req.params.id,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  reorderTask,
  deleteTask,
};
