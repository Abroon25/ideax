const { Router } = require('express');
const { 
  createPaymentOrder, 
  verifyPayment, 
  getTransactions,
  createIdeaOrder, 
  verifyIdeaPayment 
} = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const router = Router();

// (Tiers & Pay-Per-Post)
router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.get('/transactions', authenticate, getTransactions);

// (Idea Purchasing)
router.post('/idea/create-order', authenticate, createIdeaOrder);
router.post('/idea/verify', authenticate, verifyIdeaPayment);

module.exports = router;