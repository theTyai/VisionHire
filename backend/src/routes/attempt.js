const express = require('express');
const router = express.Router();
const { startAttempt, autosaveAnswer, bulkAutosave, submitAttempt, getTimer, logViolation, getResults } = require('../controllers/attemptController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Start / resume attempt
router.post('/start/:assessmentId', authorize('candidate'), startAttempt);

// CRITICAL: Autosave endpoints
router.post('/autosave/:attemptId', authorize('candidate'), autosaveAnswer);
router.post('/autosave-bulk/:attemptId', authorize('candidate'), bulkAutosave);

// Final submit
router.post('/submit/:attemptId', authorize('candidate'), submitAttempt);

// Server timer
router.get('/timer/:attemptId', authorize('candidate'), getTimer);

// Violations
router.post('/violation/:attemptId', authorize('candidate'), logViolation);

// Results
router.get('/results/:attemptId', getResults);

module.exports = router;
