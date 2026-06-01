const { Worker } = require('bullmq');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { CandidateAttempt } = require('../models');
const { getEvaluationQueue } = require('../queues');
const logger = require('../utils/logger');

const getConnection = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

const processAutoSubmit = async (job) => {
  const { attemptId, candidateId } = job.data;
  logger.info(`Auto-submitting attempt ${attemptId}`);

  const attempt = await CandidateAttempt.findOne({
    _id: attemptId,
    status: { $in: ['started', 'in-progress'] },
    isLocked: false,
  });

  if (!attempt) {
    logger.info(`Auto-submit skipped: attempt ${attemptId} already handled.`);
    return { skipped: true };
  }

  // Lock and mark auto-submitted
  await CandidateAttempt.updateOne(
    { _id: attemptId },
    {
      $set: {
        status: 'auto-submitted',
        isLocked: true,
        submitTime: new Date(),
      },
    }
  );

  // Push to evaluation queue
  const evaluationQueue = getEvaluationQueue();
  if (evaluationQueue) {
    await evaluationQueue.add('evaluate', {
      attemptId: attempt._id.toString(),
      candidateId: attempt.candidateId.toString(),
      assessmentId: attempt.assessmentId.toString(),
      autoSubmitted: true,
      reason: 'timer_expired',
    }, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  logger.info(`✅ Auto-submitted attempt ${attemptId}`);
  return { success: true };
};

const startAutoSubmitWorker = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 5 });

  const worker = new Worker(
    process.env.AUTOSUBMIT_QUEUE || 'autosubmit-queue',
    processAutoSubmit,
    {
      connection: getConnection(),
      concurrency: 20, // Can handle many expiring at same time
    }
  );

  worker.on('completed', (job) => logger.info(`Auto-submit job ${job.id} done`));
  worker.on('failed', (job, err) => logger.error(`Auto-submit job ${job?.id} failed:`, err.message));

  logger.info('🔧 Auto-submit worker started');
};

startAutoSubmitWorker().catch(err => {
  logger.error('Failed to start auto-submit worker:', err);
  process.exit(1);
});
