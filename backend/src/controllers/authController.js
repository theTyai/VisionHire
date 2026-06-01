const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { getRedis, RedisKeys } = require('../config/redis');
const logger = require('../utils/logger');

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'candidate' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Only allow candidate self-registration; admin roles require existing admin
    const allowedRole = role === 'admin' && req.user?.role === 'superadmin' ? 'admin' : 'candidate';

    const user = await User.create({ name, email, password, role: allowedRole });
    const token = generateToken(user._id);

    logger.info(`User registered: ${user.email} [${user.role}]`);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    user.loginHistory.push({
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
    });
    if (user.loginHistory.length > 20) user.loginHistory.shift();
    await user.save({ validateBeforeSave: false });

    // Store session in Redis
    const redis = getRedis();
    if (redis) {
      await redis.setex(
        RedisKeys.session(user._id.toString()),
        7 * 24 * 60 * 60, // 7 days
        JSON.stringify({ userId: user._id, role: user.role, loginAt: new Date() })
      );
    }

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, lastLogin: user.lastLogin },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const redis = getRedis();
    if (redis) {
      const sessionKey = RedisKeys.session(req.user._id.toString());
      const sessionData = await redis.get(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.revokedAt = new Date();
        await redis.setex(sessionKey, 60 * 60, JSON.stringify(session));
      }
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Password change failed.' });
  }
};

module.exports = { register, login, logout, getMe, changePassword };
