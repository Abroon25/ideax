const { Router } = require('express');
const { getAllGenres, selectGenres, getUserGenres } = require('../controllers/genreController');
const { authenticate } = require('../middleware/auth');
const router = Router();

router.get('/', getAllGenres);
router.post('/select', authenticate, selectGenres);
router.get('/my-genres', authenticate, getUserGenres);

module.exports = router;
