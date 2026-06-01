const { CandidateAttempt, CandidateAnswer, Assessment, Question, Violation } = require('../models');
const { getRedis, RedisKeys } = require('../config/redis');
const { getEvaluationQueue, getAutoSubmitQueue } = require('../queues');
const { getIO } = require('../sockets');
const logger = require('../utils/logger');

// ============================================================
// START ATTEMPT
// ============================================================
const startAttempt = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const candidateId = req.user._id;
    const redis = getRedis();

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment || assessment.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Assessment not found or not active.' });
    }

    // Check scheduling
    const now = new Date();
    if (assessment.scheduling.startTime && now < assessment.scheduling.startTime) {
      return res.status(400).json({ success: false, message: 'Assessment has not started yet.' });
    }
    if (assessment.scheduling.endTime && now > assessment.scheduling.endTime) {
      return res.status(400).json({ success: false, message: 'Assessment window has closed.' });
    }

    // Check existing attempt
    const existingAttempt = await CandidateAttempt.findOne({ candidateId, assessmentId });
    if (existingAttempt) {
      if (['submitted', 'auto-submitted', 'disqualified'].includes(existingAttempt.status)) {
        return res.status(400).json({ success: false, message: 'You have already submitted this assessment.' });
      }
      // Resume existing active attempt
      if (existingAttempt.status === 'in-progress' || existingAttempt.status === 'started') {
        const timeSinceStart = Date.now() - new Date(existingAttempt.startTime).getTime();
        if (timeSinceStart < 15000) {
          // Grace period for React Strict Mode double-fetches
          return await resumeAttempt(existingAttempt, res);
        }
        await triggerAutoSubmit(existingAttempt._id, 'abandoned_session');
        return res.status(400).json({ success: false, message: 'You have already attempted this assessment in a previous session. Resuming is not allowed.' });
      }
    }

    // Multiple login prevention
    if (redis) {
      const activeKey = RedisKeys.activeAttempt(candidateId.toString());
      const activeAttempt = await redis.get(activeKey);
      if (activeAttempt && activeAttempt !== 'null') {
        const parsedAttempt = JSON.parse(activeAttempt);
        if (parsedAttempt.assessmentId !== assessmentId.toString()) {
          return res.status(400).json({ success: false, message: 'You have another active assessment session.' });
        }
      }
    }

    // Fetch and randomize questions
    const questions = await Question.find({ assessmentId, isActive: true });
    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Assessment has no questions.' });
    }

    let questionOrder = [...questions.map(q => q._id)];
    if (assessment.config.shuffleQuestions) {
      questionOrder = shuffleArray(questionOrder);
    }

    // Build option shuffle map
    const optionShuffleMap = {};
    if (assessment.config.shuffleOptions) {
      questions.forEach(q => {
        const optionIds = q.options.map(o => o.id);
        optionShuffleMap[q._id.toString()] = shuffleArray([...optionIds]);
      });
    }

    const startTime = new Date();
    const serverEndTime = new Date(startTime.getTime() + assessment.config.duration * 60 * 1000);

    const attempt = await CandidateAttempt.create({
      candidateId,
      assessmentId,
      questionOrder,
      optionShuffleMap,
      startTime,
      serverEndTime,
      status: 'in-progress',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // Cache timer in Redis
    if (redis) {
      const ttl = Math.ceil((serverEndTime - startTime) / 1000);
      await redis.setex(RedisKeys.timer(attempt._id.toString()), ttl + 60, serverEndTime.toISOString());
      await redis.setex(
        RedisKeys.activeAttempt(candidateId.toString()),
        ttl + 60,
        JSON.stringify({ attemptId: attempt._id, assessmentId: assessmentId })
      );

      // Increment active candidate count
      await redis.incr(RedisKeys.candidateCount());
    }

    // Schedule auto-submit job
    const autoSubmitQueue = getAutoSubmitQueue();
    if (autoSubmitQueue) {
      await autoSubmitQueue.add(
        'auto-submit',
        { attemptId: attempt._id.toString(), candidateId: candidateId.toString() },
        {
          delay: assessment.config.duration * 60 * 1000 + 5000, // 5 extra seconds buffer
          jobId: `autosubmit-${attempt._id}`,
          removeOnComplete: true,
          removeOnFail: { count: 3 },
        }
      );
    }

    // Notify admin via socket
    const io = getIO();
    if (io) {
      io.to('admin-room').emit('candidate:started', {
        candidateId,
        candidateName: req.user.name,
        assessmentId,
        attemptId: attempt._id,
        timestamp: startTime,
      });
    }

    // Send questions (without correct answers)
    const questionsForCandidate = prepareQuestionsForCandidate(questions, questionOrder, optionShuffleMap, assessment.config.shuffleOptions);

    res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        questions: questionsForCandidate,
        serverEndTime: serverEndTime.toISOString(),
        startTime: startTime.toISOString(),
        config: {
          totalQuestions: questions.length,
          duration: assessment.config.duration,
          shuffleQuestions: assessment.config.shuffleQuestions,
          shuffleOptions: assessment.config.shuffleOptions,
          negativeMarking: assessment.config.negativeMarking,
          tabSwitchLimit: assessment.config.tabSwitchLimit,
          fullScreenRequired: assessment.config.fullScreenRequired,
        },
      },
    });
  } catch (error) {
    logger.error('Start attempt error:', error);
    res.status(500).json({ success: false, message: 'Failed to start assessment.' });
  }
};

// ============================================================
// AUTOSAVE ANSWER (Critical path - must be fast and reliable)
// ============================================================
const autosaveAnswer = async (req, res) => {
  const startMs = Date.now();
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOptions, isMarkedForReview, timeSpent, source } = req.body;
    const candidateId = req.user._id;

    if (!questionId) {
      return res.status(400).json({ success: false, message: 'questionId is required.' });
    }

    // Validate attempt is active (Redis first, then DB fallback)
    const redis = getRedis();
    let isValid = true;
    let attemptDoc = null;

    if (redis) {
      try {
        const timerKey = RedisKeys.timer(attemptId);
        const serverEndTime = await redis.get(timerKey);
        if (serverEndTime && new Date() > new Date(serverEndTime)) {
          isValid = false;
        } else if (!serverEndTime) {
          attemptDoc = await CandidateAttempt.findById(attemptId).select('assessmentId serverEndTime isLocked').lean();
          if (!attemptDoc || attemptDoc.isLocked || new Date() > attemptDoc.serverEndTime) isValid = false;
        }
      } catch (e) {
        attemptDoc = await CandidateAttempt.findById(attemptId).select('assessmentId serverEndTime isLocked').lean();
        if (!attemptDoc || attemptDoc.isLocked || new Date() > attemptDoc.serverEndTime) isValid = false;
      }
    } else {
      attemptDoc = await CandidateAttempt.findById(attemptId).select('assessmentId serverEndTime isLocked').lean();
      if (!attemptDoc || attemptDoc.isLocked || new Date() > attemptDoc.serverEndTime) isValid = false;
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Assessment time has expired or attempt is locked.' });
    }

    const assessmentId = attemptDoc?.assessmentId || (await CandidateAttempt.findById(attemptId).select('assessmentId').lean())?.assessmentId;

    // Upsert answer — atomic operation with E11000 retry
    let answer;
    const updatePayload = {
      $set: {
        candidateId,
        assessmentId,
        selectedOptions: selectedOptions || [],
        isMarkedForReview: isMarkedForReview ?? false,
        timeSpent: timeSpent || 0,
        savedAt: new Date(),
      },
    };
    
    try {
      answer = await CandidateAnswer.findOneAndUpdate(
        { attemptId, questionId },
        updatePayload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (upsertError) {
      if (upsertError.code === 11000) {
        // Race condition hit, retry once
        answer = await CandidateAnswer.findOneAndUpdate(
          { attemptId, questionId },
          updatePayload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else {
        throw upsertError;
      }
    }

    // Update attempt status if still 'started'
    await CandidateAttempt.updateOne(
      { _id: attemptId, status: 'started' },
      { $set: { status: 'in-progress' } }
    );

    const latency = Date.now() - startMs;
    if (latency > 500) {
      logger.warn(`Slow autosave: ${latency}ms for attempt ${attemptId}`);
    }

    res.json({
      success: true,
      savedAt: answer.savedAt,
      latency,
    });
  } catch (error) {
    logger.error('Autosave error:', error);
    // Return success-like response to prevent frontend retry storms
    res.status(500).json({ success: false, message: 'Autosave failed. Will retry.', retry: true });
  }
};

// ============================================================
// BULK AUTOSAVE (Periodic snapshot - every 15 seconds)
// ============================================================
const bulkAutosave = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers, currentQuestionIndex } = req.body;
    const candidateId = req.user._id;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.json({ success: true, message: 'No answers to save.' });
    }

    // Validate attempt
    const attempt = await CandidateAttempt.findOne({
      _id: attemptId,
      candidateId,
      status: { $in: ['started', 'in-progress'] },
    }).select('assessmentId serverEndTime isLocked').lean();

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Active attempt not found.' });
    }

    if (attempt.isLocked || new Date() > attempt.serverEndTime) {
      return res.status(400).json({ success: false, message: 'Attempt expired or locked.' });
    }

    // Bulk upsert all answers
    const bulkOps = answers.map(ans => ({
      updateOne: {
        filter: { attemptId, questionId: ans.questionId },
        update: {
          $set: {
            candidateId,
            assessmentId: attempt.assessmentId,
            selectedOptions: ans.selectedOptions || [],
            isMarkedForReview: ans.isMarkedForReview ?? false,
            timeSpent: ans.timeSpent || 0,
            isVisited: true,
            savedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await CandidateAnswer.bulkWrite(bulkOps, { ordered: false });

    // Update current question index
    if (typeof currentQuestionIndex === 'number') {
      await CandidateAttempt.updateOne(
        { _id: attemptId },
        { $set: { currentQuestionIndex } }
      );
    }

    res.json({ success: true, savedCount: answers.length, savedAt: new Date() });
  } catch (error) {
    logger.error('Bulk autosave error:', error);
    res.status(500).json({ success: false, message: 'Bulk autosave failed.', retry: true });
  }
};

// ============================================================
// FINAL SUBMIT (Lock + Queue — must be idempotent)
// ============================================================
const submitAttempt = async (req, res) => {
  const redis = getRedis();
  let lockAcquired = false;

  try {
    const { attemptId } = req.params;
    const candidateId = req.user._id;
    const { answers, currentQuestionIndex } = req.body;

    // CRITICAL: Distributed lock to prevent duplicate submissions
    const lockKey = RedisKeys.submissionLock(attemptId);
    if (redis) {
      const lockResult = await redis.set(lockKey, '1', 'EX', 30, 'NX');
      if (!lockResult) {
        return res.status(409).json({ success: false, message: 'Submission already in progress. Please wait.' });
      }
      lockAcquired = true;
    }

    const attempt = await CandidateAttempt.findOne({
      _id: attemptId,
      candidateId,
      status: { $in: ['started', 'in-progress'] },
      isLocked: false,
    });

    if (!attempt) {
      // Check if already submitted
      const submitted = await CandidateAttempt.findById(attemptId).select('status').lean();
      if (submitted && ['submitted', 'auto-submitted'].includes(submitted.status)) {
        return res.json({ success: true, message: 'Assessment already submitted.', alreadySubmitted: true });
      }
      return res.status(404).json({ success: false, message: 'Active attempt not found.' });
    }

    // Save any remaining answers from final payload
    if (Array.isArray(answers) && answers.length > 0) {
      const bulkOps = answers.map(ans => ({
        updateOne: {
          filter: { attemptId, questionId: ans.questionId },
          update: {
            $set: {
              candidateId,
              assessmentId: attempt.assessmentId,
              selectedOptions: ans.selectedOptions || [],
              isMarkedForReview: ans.isMarkedForReview ?? false,
              timeSpent: ans.timeSpent || 0,
              isVisited: true,
              savedAt: new Date(),
            },
          },
          upsert: true,
        },
      }));
      await CandidateAnswer.bulkWrite(bulkOps, { ordered: false });
    }

    // LOCK the attempt immediately
    await CandidateAttempt.updateOne(
      { _id: attemptId },
      {
        $set: {
          status: 'submitted',
          isLocked: true,
          submitTime: new Date(),
          currentQuestionIndex: currentQuestionIndex ?? attempt.currentQuestionIndex,
        },
      }
    );

    // Push evaluation job to queue
    const evaluationQueue = getEvaluationQueue();
    let jobId = null;
    if (evaluationQueue) {
      const job = await evaluationQueue.add(
        'evaluate',
        {
          attemptId: attempt._id.toString(),
          candidateId: candidateId.toString(),
          assessmentId: attempt.assessmentId.toString(),
          submittedAt: new Date().toISOString(),
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        }
      );
      jobId = job.id;

      // Update attempt with job ID
      await CandidateAttempt.updateOne({ _id: attemptId }, { $set: { submissionJobId: jobId } });
    }

    // Cleanup Redis
    if (redis) {
      await redis.del(RedisKeys.timer(attemptId));
      await redis.del(RedisKeys.activeAttempt(candidateId.toString()));
      await redis.decr(RedisKeys.candidateCount());
      
      // Remove auto-submit job
      const autoSubmitQueue = getAutoSubmitQueue();
      if (autoSubmitQueue) {
        try { await autoSubmitQueue.remove(`autosubmit-${attemptId}`); } catch (e) { /* ok */ }
      }
    }

    // Notify admin
    const io = getIO();
    if (io) {
      io.to('admin-room').emit('candidate:submitted', {
        candidateId,
        candidateName: req.user.name,
        assessmentId: attempt.assessmentId,
        attemptId: attempt._id,
        timestamp: new Date(),
      });
    }

    logger.info(`Attempt submitted: ${attemptId} by ${candidateId}`);

    res.json({
      success: true,
      message: 'Assessment submitted successfully! Results will be available shortly.',
      jobId,
      submittedAt: new Date(),
    });
  } catch (error) {
    logger.error('Submit attempt error:', error);
    res.status(500).json({ success: false, message: 'Submission failed. Please try again.' });
  } finally {
    // Always release lock
    if (lockAcquired && redis) {
      try { await redis.del(RedisKeys.submissionLock(req.params.attemptId)); } catch (e) { /* ok */ }
    }
  }
};

// ============================================================
// GET TIMER (Server-authoritative)
// ============================================================
const getTimer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const redis = getRedis();

    let serverEndTime;
    
    // Try Redis first (faster)
    if (redis) {
      const cached = await redis.get(RedisKeys.timer(attemptId));
      if (cached) serverEndTime = new Date(cached);
    }

    // Fallback to DB
    if (!serverEndTime) {
      const attempt = await CandidateAttempt.findOne({
        _id: attemptId,
        candidateId: req.user._id,
      }).select('serverEndTime status isLocked').lean();

      if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found.' });
      if (attempt.isLocked) return res.json({ success: true, expired: true });
      serverEndTime = attempt.serverEndTime;
    }

    const now = new Date();
    const remainingMs = serverEndTime - now;

    if (remainingMs <= 0) {
      return res.json({ success: true, remainingMs: 0, expired: true });
    }

    res.json({ success: true, serverEndTime, remainingMs, expired: false });
  } catch (error) {
    logger.error('Get timer error:', error);
    res.status(500).json({ success: false, message: 'Failed to get timer.' });
  }
};

// ============================================================
// LOG VIOLATION
// ============================================================
const logViolation = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { type, description, metadata } = req.body;
    const candidateId = req.user._id;

    const attempt = await CandidateAttempt.findById(attemptId).select('assessmentId tabSwitchCount fullscreenExitCount copyPasteCount isLocked');
    if (!attempt || attempt.isLocked) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    // Record violation
    const violation = await Violation.create({
      attemptId,
      candidateId,
      assessmentId: attempt.assessmentId,
      type,
      description,
      metadata,
    });

    // Update counters
    const updateField = {
      tab_switch: 'tabSwitchCount',
      fullscreen_exit: 'fullscreenExitCount',
      copy_paste: 'copyPasteCount',
    }[type];

    let updatedAttempt;
    if (updateField) {
      updatedAttempt = await CandidateAttempt.findByIdAndUpdate(
        attemptId,
        { $inc: { [updateField]: 1 } },
        { new: true }
      ).select('tabSwitchCount assessmentId');
    }

    // Check if should auto-disqualify
    const assessment = await Assessment.findById(attempt.assessmentId).select('config').lean();
    const tabLimit = assessment?.config?.tabSwitchLimit || 3;

    if (updatedAttempt?.tabSwitchCount >= tabLimit) {
      await CandidateAttempt.updateOne(
        { _id: attemptId },
        { $set: { status: 'disqualified', isDisqualified: true, isLocked: true } }
      );
    }

    // Real-time violation alert to admin
    const io = getIO();
    if (io) {
      io.to('admin-room').emit('violation:detected', {
        candidateId,
        candidateName: req.user.name,
        attemptId,
        type,
        severity: getSeverity(type),
        timestamp: new Date(),
      });
    }

    res.json({ success: true, violationId: violation._id });
  } catch (error) {
    logger.error('Log violation error:', error);
    res.status(500).json({ success: false, message: 'Failed to log violation.' });
  }
};

// ============================================================
// GET RESULTS
// ============================================================
const getResults = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { Result } = require('../models');

    const result = await Result.findOne({ attemptId })
      .populate('candidateId', 'name email')
      .populate('assessmentId', 'title config')
      .lean();

    if (!result) {
      return res.status(404).json({ success: false, message: 'Results not available yet. Please check back shortly.' });
    }

    // Only allow candidate to see their own results
    if (req.user.role === 'candidate' && result.candidateId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get results error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch results.' });
  }
};

// ============================================================
// HELPERS
// ============================================================
const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const prepareQuestionsForCandidate = (questions, questionOrder, optionShuffleMap, shuffleOptions) => {
  const questionMap = {};
  questions.forEach(q => { questionMap[q._id.toString()] = q; });

  return questionOrder.map((qId, index) => {
    const q = questionMap[qId.toString()];
    if (!q) return null;

    let options = q.options.map(o => ({ id: o.id, text: o.text })); // strip isCorrect

    if (shuffleOptions && optionShuffleMap[qId.toString()]) {
      const order = optionShuffleMap[qId.toString()];
      const optionById = {};
      options.forEach(o => { optionById[o.id] = o; });
      options = order.map(id => optionById[id]).filter(Boolean);
    }

    return {
      id: q._id,
      text: q.text,
      type: q.type,
      difficulty: q.difficulty,
      marks: q.marks,
      section: q.section,
      topic: q.topic,
      options,
      questionNumber: index + 1,
    };
  }).filter(Boolean);
};

const getSeverity = (type) => {
  const high = ['multiple_login', 'screen_capture_attempt'];
  const medium = ['tab_switch', 'fullscreen_exit'];
  return high.includes(type) ? 'high' : medium.includes(type) ? 'medium' : 'low';
};

const resumeAttempt = async (attempt, res) => {
  const questions = await Question.find({
    _id: { $in: attempt.questionOrder },
    isActive: true,
  }).lean();

  const savedAnswers = await CandidateAnswer.find({ attemptId: attempt._id })
    .select('questionId selectedOptions isMarkedForReview timeSpent isVisited')
    .lean();

  const assessment = await Assessment.findById(attempt.assessmentId).select('config').lean();
  const questionsForCandidate = prepareQuestionsForCandidate(
    questions,
    attempt.questionOrder,
    attempt.optionShuffleMap || {},
    assessment?.config?.shuffleOptions
  );

  res.json({
    success: true,
    resumed: true,
    data: {
      attemptId: attempt._id,
      questions: questionsForCandidate,
      savedAnswers,
      serverEndTime: attempt.serverEndTime,
      startTime: attempt.startTime,
      currentQuestionIndex: attempt.currentQuestionIndex,
      config: assessment?.config,
    },
  });
};

const triggerAutoSubmit = async (attemptId, reason) => {
  try {
    const attempt = await CandidateAttempt.findOne({
      _id: attemptId,
      status: { $in: ['started', 'in-progress'] },
      isLocked: false,
    });
    if (!attempt) return;

    await CandidateAttempt.updateOne(
      { _id: attemptId },
      { $set: { status: 'auto-submitted', isLocked: true, submitTime: new Date() } }
    );

    const evaluationQueue = getEvaluationQueue();
    if (evaluationQueue) {
      await evaluationQueue.add('evaluate', {
        attemptId: attempt._id.toString(),
        candidateId: attempt.candidateId.toString(),
        assessmentId: attempt.assessmentId.toString(),
        autoSubmitted: true,
        reason,
      }, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      });
    }

    logger.info(`Auto-submitted attempt ${attemptId} — reason: ${reason}`);
  } catch (error) {
    logger.error('Auto-submit trigger error:', error);
  }
};

module.exports = { startAttempt, autosaveAnswer, bulkAutosave, submitAttempt, getTimer, logViolation, getResults, triggerAutoSubmit };
