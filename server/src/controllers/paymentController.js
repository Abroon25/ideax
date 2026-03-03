const prisma = require('../config/database');
const { TIER_LIMITS, PAY_PER_POST } = require('../utils/constants');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { generateInvoicePDF } = require('../services/invoiceService');

// Check if Razorpay keys exist
const isRazorpayConfigured = !!process.env.RAZORPAY_KEY_ID;
const getRazorpay = () => {
  if (isRazorpayConfigured) {
    return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  }
  return null;
};

// ==========================================
// (Tiers & Pay-Per-Post)
// ==========================================
const createPaymentOrder = async (req, res, next) => {
  try {
    const { type, tier, extraChars, extraStorageMB } = req.body;
    let amount = 0;
    let transactionType = '';
    let metadata = {};

    switch (type) {
      case 'tier_upgrade':
        if (!['BASIC', 'PREMIUM'].includes(tier)) return res.status(400).json({ error: 'Invalid tier' });
        amount = TIER_LIMITS[tier].price;
        transactionType = 'TIER_UPGRADE';
        metadata = { tier };
        break;
      case 'pay_per_post_chars':
        amount = Math.ceil((extraChars || 50) / PAY_PER_POST.charsUnit) * PAY_PER_POST.charsRate;
        transactionType = 'PAY_PER_POST_CHARS';
        metadata = { extraChars };
        break;
      case 'pay_per_post_storage':
        amount = Math.ceil((extraStorageMB || 5) / PAY_PER_POST.storageUnitMB) * PAY_PER_POST.storageRate;
        transactionType = 'PAY_PER_POST_STORAGE';
        metadata = { extraStorageMB };
        break;
      case 'pay_per_post_monetize':
        amount = PAY_PER_POST.monetizeUnlock;
        transactionType = 'PAY_PER_POST_MONETIZE';
        break;
      default:
        return res.status(400).json({ error: 'Invalid payment type' });
    }

    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ error: 'Payment service unavailable (Razorpay keys missing)' });

    const order = await razorpay.orders.create({ amount: amount * 100, currency: 'INR', receipt: 'ideax_' + Date.now() });

    const transaction = await prisma.transaction.create({
      data: { userId: req.user.id, type: transactionType, amount, razorpayOrderId: order.id, metadata },
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, transactionId: transaction.id, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) { next(error); }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, transactionId } = req.body;

    const body = orderId + '|' + paymentId;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

    if (expected !== signature) {
      await prisma.transaction.update({ where: { id: transactionId }, data: { status: 'FAILED' } });
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'COMPLETED', razorpayPayId: paymentId, razorpaySign: signature },
    });

    if (transaction.type === 'TIER_UPGRADE') {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      await prisma.user.update({ where: { id: transaction.userId }, data: { tier: transaction.metadata.tier, tierExpiresAt: expiresAt } });
    }

    res.json({ message: 'Payment verified', transaction });
  } catch (error) { next(error); }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      include: {
        idea: { select: { content: true } },
        invoice: true,
        disputes: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const ndas = await prisma.nDA.findMany({
      where: { 
        OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }] 
      },
      include: {
        idea: { select: { content: true } },
        buyer: { select: { displayName: true, username: true } },
        seller: { select: { displayName: true, username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ transactions, ndas });
  } catch (error) { next(error); }
};

// ==========================================
// (Idea Purchase & NDA)
// ==========================================
const createIdeaOrder = async (req, res, next) => {
  try {
    const { ideaId } = req.body;
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    if (idea.isSold) return res.status(400).json({ error: 'Idea already sold' });
    if (!idea.askingPrice) return res.status(400).json({ error: 'Idea is not for sale' });

    const amountInPaise = Math.round(Number(idea.askingPrice) * 100);

    // Mock Flow
    if (!isRazorpayConfigured) {
      return res.json({ mock: true, orderId: 'mock_order_' + Date.now(), amount: amountInPaise, currency: 'INR' });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `idea_${ideaId.substring(0,8)}_${Date.now()}`
    });

    res.json({ mock: false, orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) { next(error); }
};

const verifyIdeaPayment = async (req, res, next) => {
  try {
    const { ideaId, orderId, paymentId, signature, isMock } = req.body;
    const buyerId = req.user.id;

    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea || idea.isSold) return res.status(400).json({ error: 'Invalid idea or already sold' });

    if (!isMock && isRazorpayConfigured) {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex');
      if (expectedSignature !== signature) return res.status(400).json({ error: 'Payment verification failed' });
    }

    // 1. Mark Idea as Sold
    await prisma.idea.update({
      where: { id: ideaId },
      data: { 
        isSold: true, 
        soldTo: buyerId, 
        soldAt: new Date(), 
        soldPrice: idea.askingPrice,
        totalEarnings: { increment: idea.askingPrice } 
      }
    });

    // 2. Create Transaction Record
    const transaction = await prisma.transaction.create({
      data: {
        userId: buyerId,
        ideaId: ideaId,
        type: 'IDEA_PURCHASE',
        status: 'COMPLETED',
        amount: idea.askingPrice,
        razorpayOrderId: orderId,
        razorpayPayId: paymentId || 'mock_pay_id'
      }
    });

    // 3. Create NDA
    await prisma.nDA.create({
      data: { ideaId, buyerId, sellerId: idea.authorId, status: 'SIGNED' }
    });

    // 4. Generate PDF Invoice
    const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
    generateInvoicePDF(transaction, buyer, idea).then(async (pdfUrl) => {
      await prisma.invoice.create({
        data: { transactionId: transaction.id, invoiceUrl: pdfUrl }
      });
    }).catch(err => console.error('Invoice gen failed:', err));

    res.json({ message: 'Purchase successful!', transactionId: transaction.id });
  } catch (error) { next(error); }
};

module.exports = { 
  createPaymentOrder, 
  verifyPayment, 
  getTransactions, 
  createIdeaOrder, 
  verifyIdeaPayment 
};