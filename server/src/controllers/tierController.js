const prisma = require('../config/database');
const { TIER_LIMITS } = require('../utils/constants');
const { sendTierUpgradeEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

const getTierInfo = async (req, res, next) => {
  try {
    res.json({ tiers: TIER_LIMITS, currentTier: req.user?.tier || 'FREE', tierExpiresAt: req.user?.tierExpiresAt });
  } catch (error) { next(error); }
};

const upgradeTier = async (req, res, next) => {
  try {
    const { tier } = req.body;
    if (!['BASIC', 'PREMIUM'].includes(tier)) return res.status(400).json({ error: 'Invalid tier' });

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const user = await prisma.user.update({ where: { id: req.user.id }, data: { tier, tierExpiresAt: expiresAt } });

    sendTierUpgradeEmail(user, tier).catch(console.error);
    createNotification({ type: 'TIER_UPGRADED', recipientId: req.user.id, message: 'Upgraded to ' + tier + ' tier!' }).catch(console.error);

    res.json({ message: 'Upgraded to ' + tier, tier, expiresAt });
  } catch (error) { next(error); }
};

module.exports = { getTierInfo, upgradeTier };
