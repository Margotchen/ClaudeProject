const { Router } = require('express');
const controller = require('../controllers/gift.controller');

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.detail);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.put('/:id/status', controller.updateStatus);
router.put('/:id/stock', controller.adjustStock);

module.exports = router;
