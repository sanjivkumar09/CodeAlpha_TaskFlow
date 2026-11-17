const Project = require('../models/Project');

const checkProjectAccess = (requiredRole = 'member') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id || req.body.project;

      if (!projectId) {
        return res.status(400).json({ success: false, message: 'Project ID is required' });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const userId = req.user._id.toString();
      const isOwner = project.owner.toString() === userId;
      const memberEntry = project.members.find(
        (m) => m.user.toString() === userId
      );

      if (!isOwner && !memberEntry && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not a member of this project',
        });
      }

      const userRole = isOwner
        ? 'owner'
        : memberEntry
        ? memberEntry.role
        : req.user.role === 'admin'
        ? 'admin'
        : 'member';

      if (requiredRole === 'admin' && userRole !== 'owner' && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Admin or Project Owner role required',
        });
      }

      req.project = project;
      req.userProjectRole = userRole;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { checkProjectAccess };
