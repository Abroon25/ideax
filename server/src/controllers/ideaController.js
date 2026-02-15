const prisma = require('../config/database');
const { TIER_LIMITS, PAY_PER_POST } = require('../utils/constants');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const { createNotification } = require('../services/notificationService');

const createIdea = async (req, res, next) => {
  try {
    const { content, genreId, monetizeType = 'NONE', askingPrice, profitSharePct, shareHoldingPct,
      extraCharsPaid = 0, extraStoragePaid = 0, monetizePaid = false } = req.body;
    const userId = req.user.id;
    const tierLimits = TIER_LIMITS[req.user.tier];

    if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
    if (!genreId) return res.status(400).json({ error: 'Genre required' });

    const effectiveCharLimit = tierLimits.maxChars + (parseInt(extraCharsPaid || 0) * PAY_PER_POST.charsUnit);
    if (content.length > effectiveCharLimit) {
      return res.status(400).json({ error: 'Exceeds character limit. Max: ' + effectiveCharLimit, payPerPostAvailable: true });
    }

    if (monetizeType !== 'NONE' && !tierLimits.monetizeOptions.includes(monetizeType) && !monetizePaid) {
      return res.status(403).json({ error: 'Monetize type not available in your tier', payPerPostAvailable: req.user.tier === 'FREE' });
    }

    const genre = await prisma.genre.findUnique({ where: { id: genreId } });
    if (!genre) return res.status(404).json({ error: 'Genre not found' });

    const idea = await prisma.idea.create({
      data: {
        content: content.trim(), charCount: content.length, authorId: userId, genreId,
        category: genre.category, monetizeType,
        askingPrice: askingPrice ? parseFloat(askingPrice) : null,
        profitSharePct: profitSharePct ? parseFloat(profitSharePct) : null,
        shareHoldingPct: shareHoldingPct ? parseFloat(shareHoldingPct) : null,
        extraCharsPaid: parseInt(extraCharsPaid) || 0,
        extraStoragePaid: parseInt(extraStoragePaid) || 0,
        monetizePaid: Boolean(monetizePaid),
      },
    });

    if (req.files && req.files.length > 0) {
      const attachments = [];
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer, { folder: 'ideax/ideas/' + idea.id });
          attachments.push({
            ideaId: idea.id, fileName: file.originalname, fileType: file.mimetype,
            fileSize: file.size, fileUrl: result.secure_url, cloudinaryId: result.public_id,
          });
        } catch (uploadErr) {
          console.error('Upload error:', uploadErr);
        }
      }
      if (attachments.length > 0) await prisma.attachment.createMany({ data: attachments });
    }

    const completeIdea = await prisma.idea.findUnique({
      where: { id: idea.id },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true, tier: true } },
        genre: true, attachments: true,
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
    });

    res.status(201).json({ message: 'Idea posted!', idea: completeIdea });
  } catch (error) { next(error); }
};

const getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, genreId, monetizeType, sort = 'latest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { isPublic: true };

    if (category) where.category = category;
    if (genreId) where.genreId = genreId;
    if (monetizeType) where.monetizeType = monetizeType;

    if (req.user && !category && !genreId) {
      const userGenres = await prisma.userGenre.findMany({
        where: { userId: req.user.id }, select: { genreId: true },
      });
      if (userGenres.length > 0) where.genreId = { in: userGenres.map((ug) => ug.genreId) };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'popular') orderBy = { likes: { _count: 'desc' } };

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true, tier: true } },
          genre: true, attachments: true,
          _count: { select: { likes: true, comments: true, bookmarks: true } },
          ...(req.user ? {
            likes: { where: { userId: req.user.id }, select: { id: true } },
            bookmarks: { where: { userId: req.user.id }, select: { id: true } },
          } : {}),
        },
        orderBy, skip, take: parseInt(limit),
      }),
      prisma.idea.count({ where }),
    ]);

    const transformed = ideas.map((idea) => ({
      ...idea,
      isLiked: req.user ? (idea.likes?.length > 0) : false,
      isBookmarked: req.user ? (idea.bookmarks?.length > 0) : false,
      likes: undefined, bookmarks: undefined,
    }));

    res.json({
      ideas: transformed,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)), hasMore: skip + parseInt(limit) < total },
    });
  } catch (error) { next(error); }
};

const getIdeaById = async (req, res, next) => {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true, bio: true, tier: true,
          _count: { select: { ideas: true, followers: true, following: true } } } },
        genre: true, attachments: true,
        comments: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true } },
            replies: { include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } }, orderBy: { createdAt: 'asc' } } },
          where: { parentId: null }, orderBy: { createdAt: 'desc' },
        },
        _count: { select: { likes: true, comments: true, bookmarks: true, interests: true } },
        ...(req.user ? {
          likes: { where: { userId: req.user.id }, select: { id: true } },
          bookmarks: { where: { userId: req.user.id }, select: { id: true } },
        } : {}),
      },
    });

    if (!idea) return res.status(404).json({ error: 'Idea not found' });

    await prisma.idea.update({ where: { id: req.params.id }, data: { viewCount: { increment: 1 } } });

    res.json({
      idea: { ...idea, isLiked: req.user ? idea.likes?.length > 0 : false,
        isBookmarked: req.user ? idea.bookmarks?.length > 0 : false,
        isOwner: req.user ? idea.authorId === req.user.id : false, likes: undefined, bookmarks: undefined },
    });
  } catch (error) { next(error); }
};

const deleteIdea = async (req, res, next) => {
  try {
    const idea = await prisma.idea.findUnique({ where: { id: req.params.id }, include: { attachments: true } });
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    if (idea.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    for (const att of idea.attachments) {
      if (att.cloudinaryId) await deleteFromCloudinary(att.cloudinaryId);
    }
    await prisma.idea.delete({ where: { id: req.params.id } });
    res.json({ message: 'Idea deleted' });
  } catch (error) { next(error); }
};

const likeIdea = async (req, res, next) => {
  try {
    const ideaId = req.params.id;
    const userId = req.user.id;
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) return res.status(404).json({ error: 'Not found' });

    const existing = await prisma.like.findUnique({ where: { userId_ideaId: { userId, ideaId } } });
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    }

    await prisma.like.create({ data: { userId, ideaId } });
    createNotification({ type: 'LIKE', recipientId: idea.authorId, senderId: userId, message: req.user.displayName + ' liked your idea', ideaId }).catch(console.error);
    res.json({ liked: true });
  } catch (error) { next(error); }
};

const bookmarkIdea = async (req, res, next) => {
  try {
    const ideaId = req.params.id;
    const userId = req.user.id;
    const existing = await prisma.bookmark.findUnique({ where: { userId_ideaId: { userId, ideaId } } });
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return res.json({ bookmarked: false });
    }
    await prisma.bookmark.create({ data: { userId, ideaId } });
    res.json({ bookmarked: true });
  } catch (error) { next(error); }
};

const addComment = async (req, res, next) => {
  try {
    const { content, parentId } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
    if (content.length > 1000) return res.status(400).json({ error: 'Max 1000 characters' });

    const idea = await prisma.idea.findUnique({ where: { id: req.params.id } });
    if (!idea) return res.status(404).json({ error: 'Not found' });

    const comment = await prisma.comment.create({
      data: { content: content.trim(), userId: req.user.id, ideaId: req.params.id, parentId: parentId || null },
      include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
    });

    createNotification({ type: 'COMMENT', recipientId: idea.authorId, senderId: req.user.id, message: req.user.displayName + ' commented on your idea', ideaId: req.params.id }).catch(console.error);
    res.status(201).json({ comment });
  } catch (error) { next(error); }
};

const expressInterest = async (req, res, next) => {
  try {
    const { message, offerAmount } = req.body;
    const idea = await prisma.idea.findUnique({ where: { id: req.params.id } });
    if (!idea) return res.status(404).json({ error: 'Not found' });
    if (idea.authorId === req.user.id) return res.status(400).json({ error: 'Cannot express interest in own idea' });
    if (idea.monetizeType === 'NONE') return res.status(400).json({ error: 'Not monetized' });
    if (idea.isSold) return res.status(400).json({ error: 'Already sold' });

    const interest = await prisma.ideaInterest.upsert({
      where: { ideaId_userId: { ideaId: req.params.id, userId: req.user.id } },
      update: { message, offerAmount: offerAmount ? parseFloat(offerAmount) : null },
      create: { ideaId: req.params.id, userId: req.user.id, message, offerAmount: offerAmount ? parseFloat(offerAmount) : null },
    });

    createNotification({ type: 'IDEA_INTEREST', recipientId: idea.authorId, senderId: req.user.id, message: req.user.displayName + ' is interested in your idea', ideaId: req.params.id }).catch(console.error);
    res.json({ interest, message: 'Interest expressed' });
  } catch (error) { next(error); }
};

const getIdeaInterests = async (req, res, next) => {
  try {
    const idea = await prisma.idea.findUnique({ where: { id: req.params.id } });
    if (!idea) return res.status(404).json({ error: 'Not found' });
    if (idea.authorId !== req.user.id) return res.status(403).json({ error: 'Only author can view' });

    const interests = await prisma.ideaInterest.findMany({
      where: { ideaId: req.params.id },
      include: { user: { select: { id: true, username: true, displayName: true, avatar: true, tier: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ interests });
  } catch (error) { next(error); }
};

module.exports = { createIdea, getFeed, getIdeaById, deleteIdea, likeIdea, bookmarkIdea, addComment, expressInterest, getIdeaInterests };
