const { Router } = require('express');
const { signup, login, refreshAccessToken, logout, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

module.exports = router;
