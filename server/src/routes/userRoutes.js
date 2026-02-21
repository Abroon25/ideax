const { Router } = require('express');
const { getProfile, updateProfile, uploadAvatar, changePassword, requestPasswordReset, resetPassword, completeTour, followUser, getUserIdeas, getBookmarks, searchUsers } = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = Router();

router.get('/search', optionalAuth, searchUsers);
router.get('/bookmarks', authenticate, getBookmarks);
router.put('/profile', authenticate, upload.single('avatar'), updateProfile);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.post('/change-password', authenticate, changePassword);
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/complete-tour', authenticate, completeTour);
router.post('/follow/:userId', authenticate, followUser);
router.get('/:username', optionalAuth, getProfile);
router.get('/:username/ideas', optionalAuth, getUserIdeas);

module.exports = router;