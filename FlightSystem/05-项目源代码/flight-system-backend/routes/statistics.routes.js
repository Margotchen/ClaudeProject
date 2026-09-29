const express = require('express');
const statisticsController = require('../controllers/statistics.controller');
const { requireAuth } = require('../middleware/authSession');
const { verifyRole } = require('../middleware/verifyRole');

const router = express.Router();

router.get('/dashboard', requireAuth, verifyRole('operator'), statisticsController.getDashboard);

module.exports = router;
