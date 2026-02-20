const prisma = require('../config/database');
const { sanitizeUser } = require('../utils/helpers');
const { createNotification } = require('../services/notificationService');

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      include: { userGenres: { include: { genre: true } }, _count: { select: { ideas: true, followers: true, following: true } } },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let isFollowing = false;
    if (req.user) {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: req.user.id, followingId: user.id } },
      });
      isFollowing = !!follow;
    }

    res.json({ user: { ...sanitizeUser(user), isFollowing, isOwn: req.user?.id === user.id } });
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { ...(displayName && { displayName }), ...(bio !== undefined && { bio }) },
    });
    res.json({ user: sanitizeUser(updated) });
  } catch (error) { next(error); }
};

const completeTour = async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { tourCompleted: true } });
    res.json({ message: 'Tour completed' });
  } catch (error) { next(error); }
};

const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.user.id, followingId: userId } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return res.json({ following: false });
    }

    await prisma.follow.create({ data: { followerId: req.user.id, followingId: userId } });
    createNotification({ type: 'FOLLOW', recipientId: userId, senderId: req.user.id, message: req.user.displayName + ' started following you' }).catch(console.error);
    res.json({ following: true });
  } catch (error) { next(error); }
};

const getUserIdeas = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!user) return res.status(404).json({ error: 'Not found' });

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where: { authorId: user.id, isPublic: true },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true, tier: true } },
          genre: true, attachments: true,
          _count: { select: { likes: true, comments: true, bookmarks: true } },
        },
        orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit),
      }),
      prisma.idea.count({ where: { authorId: user.id, isPublic: true } }),
    ]);

    res.json({ ideas, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) { next(error); }
};

const getBookmarks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId: req.user.id },
        include: { idea: { include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true, tier: true } },
          genre: true, attachments: true, _count: { select: { likes: true, comments: true, bookmarks: true } },
        } } },
        orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit),
      }),
      prisma.bookmark.count({ where: { userId: req.user.id } }),
    ]);

    res.json({ ideas: bookmarks.map((b) => ({ ...b.idea, isBookmarked: true })), pagination: { page: parseInt(page), total } });
  } catch (error) { next(error); }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchTerm = q.trim();

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
            { username: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          tier: true,
          _count: { select: { ideas: true, followers: true } },
        },
        orderBy: { followers: { _count: 'desc' } },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({
        where: {
          OR: [
            { displayName: { contains: searchTerm, mode: 'insensitive' } },
            { username: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    res.json({
      users,
      query: searchTerm,
      pagination: { page: parseInt(page), total, hasMore: skip + parseInt(limit) < total },
    });
  } catch (error) { next(error); }
};

module.exports = { getProfile, updateProfile, completeTour, followUser, getUserIdeas, getBookmarks, searchUsers };
