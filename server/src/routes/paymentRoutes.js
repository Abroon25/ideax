const { Router } = require('express');
const { createPaymentOrder, verifyPayment, getTransactions } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const router = Router();

router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.get('/transactions', authenticate, getTransactions);

module.exports = router;
