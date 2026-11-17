const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Project = require('../models/Project');

const initSocketIO = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication required for real-time connection'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('name email avatar role');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token for socket'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket.IO] User connected: ${socket.user.name} (${userId})`);

    // Join personal user room for direct notifications
    socket.join(`user:${userId}`);

    // Join project room after verifying membership
    socket.on('project:join', async (projectId) => {
      try {
        if (!projectId) return;
        const project = await Project.findById(projectId);
        if (!project) return;

        const isMember =
          project.owner.toString() === userId ||
          project.members.some((m) => m.user.toString() === userId) ||
          socket.user.role === 'admin';

        if (isMember) {
          socket.join(`project:${projectId}`);
          console.log(`[Socket.IO] User ${socket.user.name} joined room project:${projectId}`);
        }
      } catch (err) {
        console.error('[Socket.IO] Error joining project room:', err.message);
      }
    });

    socket.on('project:leave', (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
        console.log(`[Socket.IO] User ${socket.user.name} left room project:${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

module.exports = { initSocketIO };
