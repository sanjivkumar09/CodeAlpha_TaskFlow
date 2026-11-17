const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const { connectDB } = require('./config/db');
const { initSocketIO } = require('./sockets/socketHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const server = http.createServer(app);

// CORS options
const corsOptions = {
  origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Setup Socket.IO
const io = new Server(server, {
  cors: corsOptions,
});

initSocketIO(io);
app.set('io', io);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'TaskFlow API',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found: invalid ID format';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

// Export app and server for self-check testing or standalone run
const startServer = async () => {
  await connectDB();

  // Auto-seed demo dataset if database is empty for seamless out-of-the-box experience
  try {
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[TaskFlow] Clean database detected. Auto-seeding demo workspace...');
      const seedData = require('./seed/seed');
      await seedData();
    }
  } catch (seedErr) {
    console.warn('[TaskFlow] Auto-seed warning:', seedErr.message);
  }

  return server.listen(PORT, () => {
    console.log(`[TaskFlow API] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
