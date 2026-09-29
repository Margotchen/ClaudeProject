const { Router } = require('express');
const controller = require('../controllers/export.controller');
const { verifyRole } = require('../middleware/verifyRole');

const router = Router();

router.get('/apply', verifyRole(['hr', 'admin']), controller.exportApply);
router.get('/statistics', verifyRole(['hr', 'admin']), controller.exportStatistics);

module.exports = router;
