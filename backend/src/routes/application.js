const express = require('express');
const router = express.Router();
const { submitApplication, getApplications, updateApplication } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

// Public route to submit application
router.post('/', submitApplication);

// Admin protected routes
router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.route('/')
  .get(getApplications);

router.route('/:id')
  .put(updateApplication);

module.exports = router;
