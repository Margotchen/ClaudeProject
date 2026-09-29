const { Router } = require('express');
const controller = require('../controllers/statistics.controller');

const router = Router();

router.get('/dashboard', controller.dashboard);

module.exports = router;
