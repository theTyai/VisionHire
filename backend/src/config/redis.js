const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    const config = {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) return true;
        return false;
      },
    };

    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, config);
    } else {
      config.host = process.env.REDIS_HOST || 'localhost';
      config.port = parseInt(process.env.REDIS_PORT) || 6379;
      config.password = process.env.REDIS_PASSWORD || undefined;
      redisClient = new Redis(config);
    }

    redisClient.on('connect', () => logger.info('✅ Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error:', err));
    redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

    // Test connection
    await redisClient.ping();

  } catch (error) {
    logger.error('Redis connection failed:', error.message);
    // Don't exit - app can run without Redis (degraded mode)
  }
};

const getRedis = () => {
  if (!redisClient) {
    logger.warn('Redis not connected. Using fallback.');
    return null;
  }
  return redisClient;
};

// Redis key helpers
const RedisKeys = {
  session: (userId) => `session:${userId}`,
  timer: (attemptId) => `timer:${attemptId}`,
  activeAttempt: (userId) => `active:attempt:${userId}`,
  submissionLock: (attemptId) => `lock:submit:${attemptId}`,
  candidateCount: () => 'stats:active:candidates',
  autosaveBuffer: (attemptId, questionId) => `autosave:${attemptId}:${questionId}`,
  violationCount: (attemptId) => `violations:${attemptId}`,
};

module.exports = { connectRedis, getRedis, RedisKeys };
