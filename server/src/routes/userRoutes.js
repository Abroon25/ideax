const { Router } = require('express');
const { getProfile, updateProfile, completeTour, followUser, getUserIdeas, getBookmarks, searchUsers } = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const router = Router();

router.get('/search', optionalAuth, searchUsers);
router.get('/bookmarks', authenticate, getBookmarks);
router.put('/profile', authenticate, updateProfile);
router.post('/complete-tour', authenticate, completeTour);
router.post('/follow/:userId', authenticate, followUser);
router.get('/:username', optionalAuth, getProfile);
router.get('/:username/ideas', optionalAuth, getUserIdeas);

module.exports = router;
