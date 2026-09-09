const { Router } = require('express');
const controller = require('../controllers/activity.controller');
const { verifyRole } = require('../middleware/verifyRole');

const router = Router();

// 员工端可查看进行中的活动
router.get('/available', controller.getAvailableActivities);

// HR/Admin 管理接口
router.get('/', verifyRole(['hr', 'admin']), controller.list);
router.get('/:id', verifyRole(['hr', 'admin']), controller.detail);
router.post('/', verifyRole(['hr', 'admin']), controller.create);
router.put('/:id', verifyRole(['hr', 'admin']), controller.update);
router.delete('/:id', verifyRole(['hr', 'admin']), controller.remove);
router.put('/:id/status', verifyRole(['hr', 'admin']), controller.updateStatus);
router.get('/:id/gifts', controller.getGifts);
router.put('/:id/gifts', verifyRole(['hr', 'admin']), controller.setGifts);

module.exports = router;
