const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { requireAuth } = require('../middleware/authSession');
const { verifyRole } = require('../middleware/verifyRole');

const router = express.Router();

router.post('/simulate', requireAuth, verifyRole('passenger'), paymentController.simulatePayment);
router.get('/:orderId/status', requireAuth, paymentController.getPaymentStatus);

module.exports = router;
