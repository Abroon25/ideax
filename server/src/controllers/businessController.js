const prisma = require('../config/database');

// 3.1 Admin Dashboard Stats
const getAdminStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    const totalUsers = await prisma.user.count();
    const totalIdeas = await prisma.idea.count();
    const totalRevenue = await prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    });
    const openDisputes = await prisma.dispute.count({ where: { status: 'OPEN' } });

    res.json({
      totalUsers,
      totalIdeas,
      totalRevenue: totalRevenue._sum.amount || 0,
      openDisputes
    });
  } catch (error) { next(error); }
};

// 3.2 Analytics for Idea Owners
const getMyAnalytics = async (req, res, next) => {
  try {
    const myIdeas = await prisma.idea.findMany({
      where: { authorId: req.user.id },
      select: {
        id: true,
        content: true,
        viewCount: true,
        totalEarnings: true,
        isSold: true,
        _count: { select: { likes: true, comments: true, bookmarks: true, interests: true } }
      },
      orderBy: { viewCount: 'desc' }
    });

    const totalViews = myIdeas.reduce((sum, idea) => sum + idea.viewCount, 0);
    const totalEarnings = myIdeas.reduce((sum, idea) => sum + Number(idea.totalEarnings), 0);
    const totalInterests = myIdeas.reduce((sum, idea) => sum + idea._count.interests, 0);

    res.json({
      summary: { totalViews, totalEarnings, totalInterests, ideasCount: myIdeas.length },
      ideas: myIdeas
    });
  } catch (error) { next(error); }
};

// 3.5 Create NDA
const generateNDA = async (req, res, next) => {
  try {
    const { ideaId } = req.body;
    const buyerId = req.user.id;

    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) return res.status(404).json({ error: 'Idea not found' });

    const nda = await prisma.nDA.create({
      data: {
        ideaId,
        buyerId,
        sellerId: idea.authorId
      }
    });

    res.json({ message: 'NDA generated successfully', nda });
  } catch (error) { next(error); }
};

// 3.6 Create Dispute
const createDispute = async (req, res, next) => {
  try {
    const { transactionId, reason } = req.body;
    
    const dispute = await prisma.dispute.create({
      data: {
        transactionId,
        raisedById: req.user.id,
        reason
      }
    });

    res.json({ message: 'Dispute submitted. Admin will review shortly.', dispute });
  } catch (error) { next(error); }
};

module.exports = { getAdminStats, getMyAnalytics, generateNDA, createDispute };