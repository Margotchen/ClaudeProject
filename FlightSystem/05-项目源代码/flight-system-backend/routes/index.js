const { Router } = require('express');
const { response } = require('../utils/response');
const authRoutes = require('./auth.routes');
const flightRoutes = require('./flight.routes');
const bookingRoutes = require('./booking.routes');
const paymentRoutes = require('./payment.routes');
const checkinRoutes = require('./checkin.routes');
const refundChangeRoutes = require('./refundChange.routes');
const itineraryRoutes = require('./itinerary.routes');
const flightStatusRoutes = require('./flightStatus.routes');
const notificationRoutes = require('./notification.routes');
const statisticsRoutes = require('./statistics.routes');
const exportRoutes = require('./export.routes');

const router = Router();

router.get('/', (req, res) => {
  res.json(response(200, 'FlightSystem API is running', { version: '1.0.0' }));
});

router.use('/auth', authRoutes);
router.use('/flights', flightRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/checkin', checkinRoutes);
router.use('/refund-change', refundChangeRoutes);
router.use('/itineraries', itineraryRoutes);
router.use('/flight-status', flightStatusRoutes);
router.use('/notifications', notificationRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/export', exportRoutes);

module.exports = router;
