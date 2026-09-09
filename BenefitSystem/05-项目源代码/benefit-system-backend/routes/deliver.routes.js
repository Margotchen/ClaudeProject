const { Router } = require('express');
const controller = require('../controllers/deliver.controller');

const router = Router();

router.put('/batch', controller.batch);
router.put('/:id', controller.update);

module.exports = router;
