const { Router } = require('express');
const controller = require('../controllers/apply.controller');
const { verifyRole } = require('../middleware/verifyRole');

const router = Router();

router.get('/my-list', controller.myList);
router.get('/list', verifyRole(['hr', 'admin']), controller.list);
router.get('/:id', controller.detail);
router.post('/', controller.submit);
router.put('/:id', controller.update);
router.put('/:id/cancel', controller.cancel);

module.exports = router;
