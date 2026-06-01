const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getRedis, RedisKeys } = require('../config/redis');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check Redis session for active revocation
    const redis = getRedis();
    if (redis) {
      const sessionKey = RedisKeys.session(decoded.id);
      const sessionData = await redis.get(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.revokedAt && new Date(session.revokedAt) > new Date(decoded.iat * 1000)) {
          return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
        }
      }
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized for this action.`,
    });
  }
  next();
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = { protect, authorize, generateToken };
