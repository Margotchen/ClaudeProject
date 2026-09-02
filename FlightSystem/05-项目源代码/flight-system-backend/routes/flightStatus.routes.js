const express = require('express');
const flightStatusController = require('../controllers/flightStatus.controller');

const router = express.Router();

router.get('/', flightStatusController.listStatuses);
router.get('/:scheduleId', flightStatusController.getStatus);

module.exports = router;
