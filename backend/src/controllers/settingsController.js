const { SystemConfig } = require('../models');

// Helper to get singleton config
const getConfig = async () => {
  let config = await SystemConfig.findOne();
  if (!config) {
    config = await SystemConfig.create({ isApplicationOpen: true, isOAEnabled: false });
  }
  return config;
};

// @desc    Get public system settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
  try {
    const config = await getConfig();
    res.status(200).json({
      success: true,
      data: {
        isApplicationOpen: config.isApplicationOpen,
        isOAEnabled: config.isOAEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    let config = await getConfig();
    
    if (req.body.isApplicationOpen !== undefined) {
      config.isApplicationOpen = req.body.isApplicationOpen;
    }
    if (req.body.isOAEnabled !== undefined) {
      config.isOAEnabled = req.body.isOAEnabled;
    }

    await config.save();

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
