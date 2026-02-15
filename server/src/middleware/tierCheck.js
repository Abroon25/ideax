const { TIER_LIMITS } = require('../utils/constants');

const attachTierLimits = (req, res, next) => {
  req.tierLimits = req.user ? TIER_LIMITS[req.user.tier] : TIER_LIMITS.FREE;
  next();
};

module.exports = { attachTierLimits };
