const { Router } = require('express');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const router = Router();

router.get('/', authenticate, getNotifications);
router.post('/mark-read', authenticate, markAsRead);

module.exports = router;
