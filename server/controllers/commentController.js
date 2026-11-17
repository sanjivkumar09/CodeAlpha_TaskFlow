const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// @desc    Get comments for a task
// @route   GET /api/tasks/:id/comments
// @access  Private
const getTaskComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ task: req.params.id })
      .populate('user', 'name email avatar role')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add comment to a task
// @route   POST /api/tasks/:id/comments
// @access  Private
const createComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const taskId = req.params.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const comment = await Comment.create({
      task: taskId,
      user: req.user._id,
      content: content.trim(),
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email avatar role');

    // Notify task assignee if not the commenter
    const recipients = new Set();
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      recipients.add(task.assignedTo.toString());
    }
    if (task.createdBy && task.createdBy.toString() !== req.user._id.toString()) {
      recipients.add(task.createdBy.toString());
    }

    const io = req.app.get('io');

    for (const recipientId of recipients) {
      await Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        type: 'new_comment',
        message: `${req.user.name} commented on "${task.title}": "${content.slice(0, 45)}${content.length > 45 ? '...' : ''}"`,
        relatedProject: task.project,
        relatedTask: task._id,
      });

      if (io) {
        io.to(`user:${recipientId}`).emit('notification:new', {
          message: `${req.user.name} commented on "${task.title}"`,
          comment: populatedComment,
        });
      }
    }

    // Broadcast to project room
    if (io) {
      io.to(`project:${task.project}`).emit('comment:added', {
        taskId,
        comment: populatedComment,
      });
    }

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTaskComments,
  createComment,
};
