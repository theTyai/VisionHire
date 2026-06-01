const { Queue } = require('bullmq');
const logger = require('../utils/logger');

let evaluationQueue = null;
let autoSubmitQueue = null;

const IORedis = require('ioredis');
const getConnection = () => {
  if (process.env.REDIS_URL) {
    return new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
  };
};

const initializeQueues = () => {
  try {
    const connection = getConnection();

    evaluationQueue = new Queue(process.env.EVALUATION_QUEUE || 'evaluation-queue', {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 1000, age: 24 * 3600 },
        removeOnFail: { count: 500 },
      },
    });

    autoSubmitQueue = new Queue(process.env.AUTOSUBMIT_QUEUE || 'autosubmit-queue', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: { count: 100 },
      },
    });

    evaluationQueue.on('error', (err) => logger.error('Evaluation queue error:', err));
    autoSubmitQueue.on('error', (err) => logger.error('AutoSubmit queue error:', err));

    logger.info('✅ BullMQ queues initialized');
  } catch (error) {
    logger.error('Queue initialization failed:', error);
  }
};

const getEvaluationQueue = () => evaluationQueue;
const getAutoSubmitQueue = () => autoSubmitQueue;

module.exports = { initializeQueues, getEvaluationQueue, getAutoSubmitQueue };
