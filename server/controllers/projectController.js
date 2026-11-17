const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// @desc    Get all projects for current user (owned or member)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Admin can see all, regular user sees where owner or member
    const filter = req.user.role === 'admin'
      ? {}
      : {
          $or: [
            { owner: userId },
            { 'members.user': userId },
          ],
        };

    const projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role')
      .sort({ createdAt: -1 });

    // Attach task count statistics for each project
    const projectIds = projects.map((p) => p._id);
    const tasks = await Task.find({ project: { $in: projectIds } });

    const projectsWithStats = projects.map((p) => {
      const pObj = p.toObject();
      const pTasks = tasks.filter((t) => t.project.toString() === p._id.toString());
      const totalTasks = pTasks.length;
      const completedTasks = pTasks.filter((t) => t.status === 'done').length;
      const inProgressTasks = pTasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...pObj,
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          progress,
        },
      };
    });

    res.json({
      success: true,
      count: projectsWithStats.length,
      projects: projectsWithStats,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar bio')
      .populate('members.user', 'name email avatar role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Permission check
    const userId = req.user._id.toString();
    const isMember =
      project.owner._id.toString() === userId ||
      project.members.some((m) => m.user._id.toString() === userId) ||
      req.user.role === 'admin';

    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this project' });
    }

    const tasks = await Task.find({ project: project._id });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const pObj = project.toObject();
    pObj.stats = {
      totalTasks,
      completedTasks,
      progress,
    };

    res.json({
      success: true,
      project: pObj,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const { name, description, status, startDate, dueDate, color } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    const project = await Project.create({
      name,
      description: description || '',
      owner: req.user._id,
      status: status || 'active',
      startDate: startDate || Date.now(),
      dueDate: dueDate || null,
      color: color || '#3b82f6',
      members: [
        {
          user: req.user._id,
          role: 'admin',
          joinedAt: new Date(),
        },
      ],
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    res.status(201).json({
      success: true,
      project: populatedProject,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Owner or Admin member)
const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId;
    const memberEntry = project.members.find((m) => m.user.toString() === userId);
    const isAdmin = memberEntry && memberEntry.role === 'admin';

    if (!isOwner && !isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project owners or admins can edit project details' });
    }

    const { name, description, status, startDate, dueDate, color } = req.body;

    project.name = name || project.name;
    project.description = description !== undefined ? description : project.description;
    project.status = status || project.status;
    if (startDate) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (color) project.color = color;

    await project.save();

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar role');

    res.json({
      success: true,
      project: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner only)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userId = req.user._id.toString();
    const isOwner = project.owner.toString() === userId || req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete this project' });
    }

    // Cascade delete tasks and their comments
    const tasks = await Task.find({ project: project._id });
    const taskIds = tasks.map((t) => t._id);

    await Comment.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ project: project._id });
    await Notification.deleteMany({ relatedProject: project._id });
    await project.deleteOne();

    res.json({
      success: true,
      message: 'Project and all associated tasks removed successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
