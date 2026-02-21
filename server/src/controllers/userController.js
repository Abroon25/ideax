const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { sanitizeUser } = require('../utils/helpers');
const { createNotification } = require('../services/notificationService');
const { uploadToCloudinary } = require('../services/cloudinaryService');

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

    res.json({ user: Object.assign({}, sanitizeUser(user), { isFollowing: isFollowing, isOwn: req.user ? req.user.id === user.id : false }) });
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio } = req.body;
    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, { folder: 'ideax/avatars', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] });
        updateData.avatar = result.secure_url;
      } catch (uploadErr) {
        console.error('Avatar upload error:', uploadErr);
      }
    }

    const updated = await prisma.user.update({ where: { id: req.user.id }, data: updateData });
    res.json({ user: sanitizeUser(updated) });
  } catch (error) { next(error); }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'ideax/avatars',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    });

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: result.secure_url },
    });

    res.json({ message: 'Avatar updated', avatar: result.secure_url, user: sanitizeUser(updated) });
  } catch (error) { next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashedPassword } });

    res.json({ message: 'Password changed successfully' });
  } catch (error) { next(error); }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) return res.json({ message: 'If an account exists with this email, a reset link has been sent' });

    var crypto = require('crypto');
    var resetToken = crypto.randomBytes(32).toString('hex');
    var resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: resetToken, resetTokenExpiry: resetExpiry },
    });

    res.json({ message: 'If an account exists with this email, a reset link has been sent', resetToken: resetToken });
  } catch (error) { next(error); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ message: 'Password reset successfully' });
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
        orderBy: { createdAt: 'desc' }, skip: skip, take: parseInt(limit),
      }),
      prisma.idea.count({ where: { authorId: user.id, isPublic: true } }),
    ]);

    res.json({ ideas: ideas, pagination: { page: parseInt(page), limit: parseInt(limit), total: total } });
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
        orderBy: { createdAt: 'desc' }, skip: skip, take: parseInt(limit),
      }),
      prisma.bookmark.count({ where: { userId: req.user.id } }),
    ]);

    res.json({ ideas: bookmarks.map(function(b) { return Object.assign({}, b.idea, { isBookmarked: true }); }), pagination: { page: parseInt(page), total: total } });
  } catch (error) { next(error); }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Search query must be at least 2 characters' });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchTerm = q.trim();

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { OR: [
          { displayName: { contains: searchTerm, mode: 'insensitive' } },
          { username: { contains: searchTerm, mode: 'insensitive' } },
        ] },
        select: { id: true, username: true, displayName: true, avatar: true, bio: true, tier: true, _count: { select: { ideas: true, followers: true } } },
        orderBy: { followers: { _count: 'desc' } },
        skip: skip, take: parseInt(limit),
      }),
      prisma.user.count({ where: { OR: [
        { displayName: { contains: searchTerm, mode: 'insensitive' } },
        { username: { contains: searchTerm, mode: 'insensitive' } },
      ] } }),
    ]);

    res.json({ users: users, query: searchTerm, pagination: { page: parseInt(page), total: total, hasMore: skip + parseInt(limit) < total } });
  } catch (error) { next(error); }
};

module.exports = { getProfile, updateProfile, uploadAvatar, changePassword, requestPasswordReset, resetPassword, completeTour, followUser, getUserIdeas, getBookmarks, searchUsers };