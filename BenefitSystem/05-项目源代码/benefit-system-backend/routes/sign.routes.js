const { Router } = require('express');
const controller = require('../controllers/sign.controller');
const { verifyRole } = require('../middleware/verifyRole');

const router = Router();

router.put('/:id', controller.sign);
router.get('/feedback', verifyRole(['hr', 'admin']), controller.listFeedback);

module.exports = router;
