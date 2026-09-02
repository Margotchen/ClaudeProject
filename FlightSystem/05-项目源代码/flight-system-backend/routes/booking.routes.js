const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { requireAuth } = require('../middleware/authSession');
const { verifyRole } = require('../middleware/verifyRole');

const router = express.Router();

router.post('/', requireAuth, verifyRole('passenger'), bookingController.createBooking);
router.get('/my', requireAuth, verifyRole('passenger'), bookingController.getMyOrders);
router.get('/:id', requireAuth, bookingController.getOrderDetail);
router.post('/:id/cancel', requireAuth, verifyRole('passenger'), bookingController.cancelOrder);

module.exports = router;
