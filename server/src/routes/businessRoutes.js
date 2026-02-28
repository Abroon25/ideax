const router = require('express').Router();
const { getAdminStats, getMyAnalytics, generateNDA, createDispute } = require('../controllers/businessController');
const { authenticate } = require('../middleware/auth');

// Admin Routes
router.get('/admin/stats', authenticate, getAdminStats);

// Analytics
router.get('/analytics', authenticate, getMyAnalytics);

// NDAs
router.post('/ndas/generate', authenticate, generateNDA);

// Disputes
router.post('/disputes', authenticate, createDispute);

module.exports = router;