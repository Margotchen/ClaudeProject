const express = require('express');
const checkinController = require('../controllers/checkin.controller');
const { requireAuth } = require('../middleware/authSession');
const { verifyRole } = require('../middleware/verifyRole');

const router = express.Router();

router.get('/seats/:orderId', requireAuth, verifyRole('passenger'), checkinController.getSeatMap);
router.post('/select-seat', requireAuth, verifyRole('passenger'), checkinController.selectSeat);
router.post('/checkin/:orderId', requireAuth, verifyRole('passenger'), checkinController.checkIn);

module.exports = router;
