const { Router } = require('express');
const { getTierInfo, upgradeTier } = require('../controllers/tierController');
const { authenticate } = require('../middleware/auth');
const router = Router();

router.get('/', authenticate, getTierInfo);
router.post('/upgrade', authenticate, upgradeTier);

module.exports = router;
