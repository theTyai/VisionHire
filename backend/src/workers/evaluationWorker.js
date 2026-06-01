const { Worker } = require('bullmq');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { CandidateAttempt, CandidateAnswer, Question, Assessment, Result } = require('../models');
const logger = require('../utils/logger');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 });
  logger.info('Worker: MongoDB connected');
};

const IORedis = require('ioredis');
const getConnection = () => {
  if (process.env.REDIS_URL) {
    return new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  };
};

const processEvaluation = async (job) => {
  const { attemptId, candidateId, assessmentId, autoSubmitted } = job.data;
  logger.info(`Evaluating attempt ${attemptId} [job ${job.id}]`);

  const attempt = await CandidateAttempt.findById(attemptId);
  if (!attempt) throw new Error(`Attempt ${attemptId} not found`);

  if (attempt.isEvaluated) {
    logger.info(`Attempt ${attemptId} already evaluated. Skipping.`);
    return { skipped: true };
  }

  const assessment = await Assessment.findById(assessmentId).lean();
  const questions = await Question.find({ assessmentId, isActive: true }).lean();
  const answers = await CandidateAnswer.find({ attemptId }).lean();

  // Build lookup maps
  const questionMap = {};
  questions.forEach(q => { questionMap[q._id.toString()] = q; });

  const answerMap = {};
  answers.forEach(a => { answerMap[a.questionId.toString()] = a; });

  // Scoring
  let totalScore = 0;
  let totalMarks = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let attempted = 0;

  const sectionMap = {};
  const topicMap = {};
  const difficultyMap = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
  const answerUpdates = [];

  for (const question of questions) {
    const qId = question._id.toString();
    const answer = answerMap[qId];
    const marks = question.marks || 1;
    const negativeMarks = assessment.config.negativeMarking ? (question.negativeMarks || assessment.config.negativeMarkValue || 0.25) : 0;

    totalMarks += marks;

    // Section tracking
    const section = question.section || 'General';
    if (!sectionMap[section]) sectionMap[section] = { section, score: 0, totalMarks: 0, correct: 0, wrong: 0, skipped: 0 };
    sectionMap[section].totalMarks += marks;

    // Topic tracking
    const topic = question.topic || 'General';
    if (!topicMap[topic]) topicMap[topic] = { topic, correct: 0, total: 0 };
    topicMap[topic].total++;

    // Difficulty tracking
    const diff = question.difficulty || 'medium';
    difficultyMap[diff].total++;

    if (!answer || !answer.selectedOptions || answer.selectedOptions.length === 0) {
      skipped++;
      sectionMap[section].skipped++;
      answerUpdates.push({ questionId: qId, isCorrect: false, marksAwarded: 0 });
      continue;
    }

    attempted++;
    const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id);
    const selectedIds = answer.selectedOptions;

    let isCorrect = false;

    if (question.type === 'single') {
      isCorrect = selectedIds.length === 1 && correctOptionIds.includes(selectedIds[0]);
    } else {
      // Multiple correct: all correct and no wrong
      const selectedSet = new Set(selectedIds);
      const correctSet = new Set(correctOptionIds);
      isCorrect = selectedIds.length === correctOptionIds.length &&
        selectedIds.every(id => correctSet.has(id));
    }

    let marksAwarded = 0;
    if (isCorrect) {
      marksAwarded = marks;
      totalScore += marks;
      correct++;
      sectionMap[section].correct++;
      sectionMap[section].score += marks;
      topicMap[topic].correct++;
      difficultyMap[diff].correct++;
    } else {
      marksAwarded = -negativeMarks;
      totalScore -= negativeMarks;
      wrong++;
      sectionMap[section].wrong++;
    }

    answerUpdates.push({ questionId: qId, isCorrect, marksAwarded });
  }

  // Ensure score doesn't go below 0
  totalScore = Math.max(0, totalScore);
  const percentage = totalMarks > 0 ? parseFloat(((totalScore / totalMarks) * 100).toFixed(2)) : 0;
  const isPassed = percentage >= (assessment.config.passingScore || 50);

  const timeTaken = attempt.submitTime
    ? Math.floor((attempt.submitTime - attempt.startTime) / 1000)
    : Math.floor((new Date() - attempt.startTime) / 1000);

  // Topic-wise accuracy
  const topicWise = Object.values(topicMap).map(t => ({
    ...t,
    accuracy: t.total > 0 ? parseFloat(((t.correct / t.total) * 100).toFixed(2)) : 0,
  }));

  // Bulk update answers with evaluation
  if (answerUpdates.length > 0) {
    const bulkOps = answerUpdates.map(upd => ({
      updateOne: {
        filter: { attemptId, questionId: upd.questionId },
        update: { $set: { isCorrect: upd.isCorrect, marksAwarded: upd.marksAwarded } },
      },
    }));
    await CandidateAnswer.bulkWrite(bulkOps, { ordered: false });
  }

  // Save result
  const result = await Result.findOneAndUpdate(
    { attemptId },
    {
      $set: {
        candidateId,
        assessmentId,
        score: totalScore,
        totalMarks,
        percentage,
        isPassed,
        totalQuestions: questions.length,
        attempted,
        correct,
        wrong,
        skipped,
        sectionWise: Object.values(sectionMap),
        topicWise,
        difficultyWise: difficultyMap,
        timeTaken,
        evaluatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  // Update attempt
  await CandidateAttempt.updateOne(
    { _id: attemptId },
    {
      $set: {
        score: totalScore,
        totalMarks,
        percentage,
        isPassed,
        isEvaluated: true,
        evaluatedAt: new Date(),
      },
    }
  );

  // Compute rank (async, non-blocking)
  computeRank(assessmentId, attemptId, result._id).catch(err => logger.error('Rank compute error:', err));

  logger.info(`✅ Evaluation complete: attempt ${attemptId} | Score: ${totalScore}/${totalMarks} (${percentage}%)`);

  return { success: true, score: totalScore, totalMarks, percentage, isPassed };
};

const computeRank = async (assessmentId, attemptId, resultId) => {
  const allResults = await Result.find({ assessmentId })
    .sort({ score: -1, timeTaken: 1 })
    .select('_id score')
    .lean();

  const bulkOps = allResults.map((r, i) => ({
    updateOne: {
      filter: { _id: r._id },
      update: { $set: { rank: i + 1 } },
    },
  }));

  if (bulkOps.length > 0) {
    await Result.bulkWrite(bulkOps, { ordered: false });
    await CandidateAttempt.updateOne(
      { _id: attemptId },
      { $set: { rank: allResults.findIndex(r => r._id.toString() === resultId.toString()) + 1 } }
    );
  }
};

// Start worker
const startWorker = async () => {
  await connectDB();

  const worker = new Worker(
    process.env.EVALUATION_QUEUE || 'evaluation-queue',
    processEvaluation,
    {
      connection: getConnection(),
      concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 10,
    }
  );

  worker.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completed`, result);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    logger.error('Worker error:', err);
  });

  logger.info('🔧 Evaluation worker started');
};

startWorker().catch(err => {
  logger.error('Failed to start evaluation worker:', err);
  process.exit(1);
});
