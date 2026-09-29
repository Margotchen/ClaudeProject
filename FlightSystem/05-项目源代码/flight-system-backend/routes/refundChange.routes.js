const express = require('express');
const refundChangeController = require('../controllers/refundChange.controller');
const { requireAuth } = require('../middleware/authSession');
const { verifyRole } = require('../middleware/verifyRole');

const router = express.Router();

// Passenger
router.post('/refund', requireAuth, verifyRole('passenger'), refundChangeController.applyRefund);
router.post('/change', requireAuth, verifyRole('passenger'), refundChangeController.applyChange);
router.get('/my', requireAuth, verifyRole('passenger'), refundChangeController.getMyApplications);

// Service
router.get('/pending', requireAuth, verifyRole('service'), refundChangeController.getPendingApplications);
router.put('/:id/process', requireAuth, verifyRole('service'), refundChangeController.processApplication);

module.exports = router;
