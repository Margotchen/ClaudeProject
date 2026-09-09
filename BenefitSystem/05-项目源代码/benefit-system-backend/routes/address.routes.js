const { Router } = require('express');
const controller = require('../controllers/address.controller');

const router = Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.put('/:id/default', controller.setDefault);

module.exports = router;
