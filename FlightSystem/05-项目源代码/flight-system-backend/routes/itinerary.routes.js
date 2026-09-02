const express = require('express');
const itineraryController = require('../controllers/itinerary.controller');
const { requireAuth } = require('../middleware/authSession');

const router = express.Router();

router.get('/:orderId', requireAuth, itineraryController.getItinerary);
router.get('/:orderId/pdf', requireAuth, itineraryController.downloadPDF);

module.exports = router;
