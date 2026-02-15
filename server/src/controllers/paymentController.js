const prisma = require('../config/database');
const { TIER_LIMITS, PAY_PER_POST } = require('../utils/constants');
const crypto = require('crypto');

let razorpayInstance = null;
const getRazorpay = () => {
  if (!razorpayInstance && process.env.RAZORPAY_KEY_ID) {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  }
  return razorpayInstance;
};

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
    if (!razorpay) return res.status(503).json({ error: 'Payment service unavailable' });

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
      where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50,
    });
    res.json({ transactions });
  } catch (error) { next(error); }
};

module.exports = { createPaymentOrder, verifyPayment, getTransactions };
