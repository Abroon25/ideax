const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, email: true, username: true, displayName: true,
        tier: true, tierExpiresAt: true, isVerified: true,
        isOnboarded: true, tourCompleted: true, avatar: true, phone: true,
      },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });

    if (user.tierExpiresAt && new Date(user.tierExpiresAt) < new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { tier: 'FREE', tierExpiresAt: null },
      });
      user.tier = 'FREE';
      user.tierExpiresAt = null;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, username: true, displayName: true, tier: true, avatar: true },
    });
    req.user = user;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { authenticate, optionalAuth };
