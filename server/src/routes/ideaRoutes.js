const { Router } = require('express');
const { createIdea, getFeed, getIdeaById, deleteIdea, likeIdea, bookmarkIdea, addComment, expressInterest, getIdeaInterests } = require('../controllers/ideaController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { attachTierLimits } = require('../middleware/tierCheck');
const upload = require('../middleware/upload');
const router = Router();

router.get('/feed', optionalAuth, getFeed);
router.get('/:id', optionalAuth, getIdeaById);
router.post('/', authenticate, attachTierLimits, upload.array('files', 10), createIdea);
router.delete('/:id', authenticate, deleteIdea);
router.post('/:id/like', authenticate, likeIdea);
router.post('/:id/bookmark', authenticate, bookmarkIdea);
router.post('/:id/comment', authenticate, addComment);
router.post('/:id/interest', authenticate, expressInterest);
router.get('/:id/interests', authenticate, getIdeaInterests);

module.exports = router;
