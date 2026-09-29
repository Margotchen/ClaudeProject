const express = require('express');
const exportController = require('../controllers/export.controller');
const { requireAuth } = require('../middleware/authSession');
const { verifyRole } = require('../middleware/verifyRole');

const router = express.Router();

router.get('/orders', requireAuth, verifyRole('operator'), exportController.exportOrders);
router.get('/flights', requireAuth, verifyRole('operator'), exportController.exportFlights);

module.exports = router;
