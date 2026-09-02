const express = require('express');
const flightController = require('../controllers/flight.controller');
const { requireAuth } = require('../middleware/authSession');
const { verifyRole } = require('../middleware/verifyRole');

const router = express.Router();

// Public / passenger search
router.get('/search', flightController.searchFlights);

// Operator flight management
router.get('/', requireAuth, verifyRole('operator'), flightController.listFlights);
router.post('/', requireAuth, verifyRole('operator'), flightController.createFlight);
router.get('/:id', requireAuth, verifyRole('operator'), flightController.getFlight);
router.put('/:id', requireAuth, verifyRole('operator'), flightController.updateFlight);
router.delete('/:id', requireAuth, verifyRole('operator'), flightController.deleteFlight);

// Operator schedule management
router.get('/schedules/list', requireAuth, verifyRole('operator'), flightController.listSchedules);
router.post('/schedules', requireAuth, verifyRole('operator'), flightController.createSchedule);
router.get('/schedules/:id', requireAuth, flightController.getSchedule);
router.put('/schedules/:id', requireAuth, verifyRole('operator'), flightController.updateSchedule);
router.delete('/schedules/:id', requireAuth, verifyRole('operator'), flightController.deleteSchedule);
router.put('/schedules/:id/status', requireAuth, verifyRole('operator'), flightController.updateScheduleStatus);

module.exports = router;
