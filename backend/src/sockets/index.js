const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getRedis, RedisKeys } = require('../config/redis');
const logger = require('../utils/logger');

let io = null;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password').lean();
      if (!user || !user.isActive) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`Socket connected: ${user.name} [${user.role}] — ${socket.id}`);

    // Admin joins admin room for live monitoring
    if (user.role === 'admin' || user.role === 'superadmin') {
      socket.join('admin-room');
      socket.emit('connected', { room: 'admin-room', userId: user._id });
    }

    // Candidate joins their own room
    socket.join(`candidate:${user._id}`);
    socket.emit('connected', { userId: user._id });

    // Candidate heartbeat - update active count
    socket.on('heartbeat', async (data) => {
      const redis = getRedis();
      if (redis && data.attemptId) {
        // Update timer sync
        const timerKey = RedisKeys.timer(data.attemptId);
        const endTime = await redis.get(timerKey);
        if (endTime) {
          socket.emit('timer:sync', {
            serverEndTime: endTime,
            remainingMs: Math.max(0, new Date(endTime) - new Date()),
          });
        }
      }
    });

    // Admin requests active candidates list
    socket.on('admin:get-active', async () => {
      if (!['admin', 'superadmin'].includes(user.role)) return;

      const redis = getRedis();
      let activeCount = 0;
      if (redis) {
        const count = await redis.get(RedisKeys.candidateCount());
        activeCount = parseInt(count) || 0;
      }

      socket.emit('admin:active-count', { count: activeCount, timestamp: new Date() });
    });

    // Force submit (admin emergency action)
    socket.on('admin:force-submit', async (data) => {
      if (!['admin', 'superadmin'].includes(user.role)) return;
      const { attemptId } = data;

      // Notify candidate
      io.to(`candidate:${data.candidateId}`).emit('force-submit', {
        reason: 'Admin initiated force submit',
        attemptId,
      });
    });

    // Candidate violation from frontend
    socket.on('violation', (data) => {
      if (user.role !== 'candidate') return;
      io.to('admin-room').emit('violation:live', {
        candidateId: user._id,
        candidateName: user.name,
        ...data,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${user.name} — ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${user.name}:`, err);
    });
  });

  logger.info('✅ Socket.IO initialized');
  return io;
};

const getIO = () => io;

module.exports = { initializeSocket, getIO };
