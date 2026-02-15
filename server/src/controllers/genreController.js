const prisma = require('../config/database');

const getAllGenres = async (req, res, next) => {
  try {
    const genres = await prisma.genre.findMany({ orderBy: { name: 'asc' } });
    res.json({ genres });
  } catch (error) { next(error); }
};

const selectGenres = async (req, res, next) => {
  try {
    const { genreIds } = req.body;
    const userId = req.user.id;

    if (!genreIds || !Array.isArray(genreIds) || genreIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one genre' });
    }
    if (genreIds.length > 10) return res.status(400).json({ error: 'Max 10 genres' });

    await prisma.userGenre.deleteMany({ where: { userId } });
    await prisma.userGenre.createMany({
      data: genreIds.map((genreId) => ({ userId, genreId })),
    });
    await prisma.user.update({ where: { id: userId }, data: { isOnboarded: true } });

    const userGenres = await prisma.userGenre.findMany({
      where: { userId }, include: { genre: true },
    });
    res.json({ message: 'Genres selected', genres: userGenres.map((ug) => ug.genre) });
  } catch (error) { next(error); }
};

const getUserGenres = async (req, res, next) => {
  try {
    const userGenres = await prisma.userGenre.findMany({
      where: { userId: req.user.id }, include: { genre: true },
    });
    res.json({ genres: userGenres.map((ug) => ug.genre) });
  } catch (error) { next(error); }
};

module.exports = { getAllGenres, selectGenres, getUserGenres };
