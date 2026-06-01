const { RecruitmentApplication } = require('../models');

// @desc    Submit recruitment application
// @route   POST /api/applications
// @access  Public
exports.submitApplication = async (req, res) => {
  try {
    const { name, scholarNo, section, branch, email, primaryDomain, secondaryDomain } = req.body;

    const { SystemConfig } = require('../models');
    let config = await SystemConfig.findOne();
    if (config && !config.isApplicationOpen) {
      return res.status(403).json({ success: false, message: 'Recruitment applications are currently closed.' });
    }

    // Basic validation
    if (!name || !scholarNo || !section || !branch || !email || !primaryDomain || !secondaryDomain) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if email or scholar number already exists
    const existingApp = await RecruitmentApplication.findOne({
      $or: [{ email }, { scholarNo }]
    });

    if (existingApp) {
      return res.status(400).json({ 
        success: false, 
        message: 'An application with this email or scholar number has already been submitted.' 
      });
    }

    const application = await RecruitmentApplication.create({
      name,
      scholarNo,
      section,
      branch,
      email,
      primaryDomain,
      secondaryDomain
    });

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private/Admin
exports.getApplications = async (req, res) => {
  try {
    const applications = await RecruitmentApplication.find().sort('-createdAt');

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id
// @access  Private/Admin
exports.updateApplication = async (req, res) => {
  try {
    let application = await RecruitmentApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application = await RecruitmentApplication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
