const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow';

  try {
    // Attempt connecting to the specified MONGODB_URI
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout to fallback if no local server
    });
    console.log(`[TaskFlow DB] MongoDB Connected to host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[TaskFlow DB] Could not connect to external MongoDB (${uri}): ${err.message}`);
    console.log('[TaskFlow DB] Initializing embedded MongoDB Memory Server for seamless local execution...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[TaskFlow DB] Connected to embedded in-memory MongoDB: ${memUri}`);
      return conn;
    } catch (memErr) {
      console.error(`[TaskFlow DB] Critical error starting database: ${memErr.message}`);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[TaskFlow DB] MongoDB disconnected cleanly.');
  } catch (err) {
    console.error('[TaskFlow DB] Error disconnecting:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
