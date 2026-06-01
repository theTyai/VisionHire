const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { Assessment, Question, CandidateAttempt, Result, User } = require('../models');
const logger = require('../utils/logger');

const assessmentRouter = express.Router();
const questionRouter = express.Router();
const adminRouter = express.Router();
const analyticsRouter = express.Router();

assessmentRouter.use(protect);
questionRouter.use(protect);
adminRouter.use(protect, authorize('admin', 'superadmin'));
analyticsRouter.use(protect);

// ─── ASSESSMENTS ─────────────────────────────────────────────
assessmentRouter.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'candidate') {
      filter.status = 'published';
    } else {
      if (status) filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [assessments, total] = await Promise.all([
      Assessment.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Assessment.countDocuments(filter),
    ]);

    res.json({ success: true, data: assessments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assessments.' });
  }
});

assessmentRouter.get('/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id).populate('createdBy', 'name email').lean();
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });

    // Hide sensitive config from candidates
    if (req.user.role === 'candidate') {
      delete assessment.invitedCandidates;
    }

    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assessment.' });
  }
});

assessmentRouter.post('/', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const slug = req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const assessment = await Assessment.create({ ...req.body, createdBy: req.user._id, slug });
    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    logger.error('Create assessment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create assessment.' });
  }
});

assessmentRouter.put('/:id', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update assessment.' });
  }
});

assessmentRouter.delete('/:id', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    await Assessment.findByIdAndUpdate(req.params.id, { status: 'archived' });
    res.json({ success: true, message: 'Assessment archived.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to archive assessment.' });
  }
});

// ─── QUESTIONS ────────────────────────────────────────────────
questionRouter.get('/', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { assessmentId, section, difficulty, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (assessmentId) filter.assessmentId = assessmentId;
    if (section) filter.section = section;
    if (difficulty) filter.difficulty = difficulty;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [questions, total] = await Promise.all([
      Question.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Question.countDocuments(filter),
    ]);

    res.json({ success: true, data: questions, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch questions.' });
  }
});

questionRouter.post('/', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const question = await Question.create(req.body);
    await Assessment.findByIdAndUpdate(req.body.assessmentId, { $inc: { 'config.totalQuestions': 1 } });
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create question.' });
  }
});

questionRouter.post('/bulk', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { questions, assessmentId } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions array required.' });
    }

    const preparedQuestions = questions.map((q, i) => ({ ...q, assessmentId, order: i }));
    const inserted = await Question.insertMany(preparedQuestions, { ordered: false });

    await Assessment.findByIdAndUpdate(assessmentId, { $set: { 'config.totalQuestions': inserted.length } });

    res.status(201).json({ success: true, data: { inserted: inserted.length } });
  } catch (error) {
    logger.error('Bulk insert error:', error);
    res.status(500).json({ success: false, message: 'Bulk insert failed.' });
  }
});

questionRouter.put('/:id', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' });
    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update question.' });
  }
});

questionRouter.delete('/:id', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Question removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete question.' });
  }
});

// ─── ADMIN ────────────────────────────────────────────────────
adminRouter.get('/candidates', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: 'candidate', isActive: true };
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [candidates, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: candidates, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidates.' });
  }
});

adminRouter.get('/attempts/:assessmentId', async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { assessmentId: req.params.assessmentId };
    if (status) filter.status = status;

    const attempts = await CandidateAttempt.find(filter)
      .populate('candidateId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attempts.' });
  }
});

adminRouter.get('/leaderboard/:assessmentId', async (req, res) => {
  try {
    const results = await Result.find({ assessmentId: req.params.assessmentId })
      .populate('candidateId', 'name email')
      .sort({ score: -1, timeTaken: 1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard.' });
  }
});

adminRouter.patch('/shortlist/:resultId', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await Result.findByIdAndUpdate(req.params.resultId, { shortlistedStatus: status }, { new: true });
    if (!result) return res.status(404).json({ success: false, message: 'Result not found.' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update shortlist status.' });
  }
});

adminRouter.get('/stats', async (req, res) => {
  try {
    const [totalCandidates, totalAssessments, totalAttempts, submittedAttempts] = await Promise.all([
      User.countDocuments({ role: 'candidate' }),
      Assessment.countDocuments({ status: { $ne: 'archived' } }),
      CandidateAttempt.countDocuments(),
      CandidateAttempt.countDocuments({ status: { $in: ['submitted', 'auto-submitted'] } }),
    ]);

    const { getRedis, RedisKeys } = require('../config/redis');
    const redis = getRedis();
    let activeCandidates = 0;
    if (redis) {
      const count = await redis.get(RedisKeys.candidateCount());
      activeCandidates = parseInt(count) || 0;
    }

    res.json({
      success: true,
      data: { totalCandidates, totalAssessments, totalAttempts, submittedAttempts, activeCandidates },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

// ─── ANALYTICS ────────────────────────────────────────────────
analyticsRouter.get('/assessment/:assessmentId', async (req, res) => {
  try {
    const results = await Result.find({ assessmentId: req.params.assessmentId }).lean();
    if (results.length === 0) return res.json({ success: true, data: {} });

    const avgScore = results.reduce((s, r) => s + r.percentage, 0) / results.length;
    const passCount = results.filter(r => r.isPassed).length;
    const passRate = (passCount / results.length) * 100;

    // Score distribution
    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    results.forEach(r => {
      const p = r.percentage;
      if (p <= 20) buckets['0-20']++;
      else if (p <= 40) buckets['21-40']++;
      else if (p <= 60) buckets['41-60']++;
      else if (p <= 80) buckets['61-80']++;
      else buckets['81-100']++;
    });

    // Topic-wise aggregation
    const topicAgg = {};
    results.forEach(r => {
      (r.topicWise || []).forEach(t => {
        if (!topicAgg[t.topic]) topicAgg[t.topic] = { topic: t.topic, correct: 0, total: 0 };
        topicAgg[t.topic].correct += t.correct;
        topicAgg[t.topic].total += t.total;
      });
    });

    const topicWise = Object.values(topicAgg).map(t => ({
      ...t,
      accuracy: t.total > 0 ? parseFloat(((t.correct / t.total) * 100).toFixed(2)) : 0,
    }));

    res.json({
      success: true,
      data: {
        totalAttempts: results.length,
        avgScore: parseFloat(avgScore.toFixed(2)),
        passRate: parseFloat(passRate.toFixed(2)),
        scoreDistribution: buckets,
        topicWise,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
});

analyticsRouter.get('/candidate/:candidateId', protect, async (req, res) => {
  try {
    // Candidates can only see their own
    if (req.user.role === 'candidate' && req.user._id.toString() !== req.params.candidateId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const results = await Result.find({ candidateId: req.params.candidateId })
      .populate('assessmentId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidate analytics.' });
  }
});

module.exports = {
  assessmentRoutes: assessmentRouter,
  questionRoutes: questionRouter,
  adminRoutes: adminRouter,
  analyticsRoutes: analyticsRouter,
};
